from django.utils import timezone

from apps.orders.models import Order, OrderEvent
from apps.payments.models import Payment
from apps.store_settings.models import Coupon


def apply_coupon(code: str, subtotal: int) -> int:
    if not code:
        return 0
    coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()
    if not coupon:
        return 0
    now = timezone.now()
    if coupon.valid_from > now or coupon.valid_to < now:
        return 0
    if coupon.max_uses and coupon.used >= coupon.max_uses:
        return 0
    if coupon.min_total and subtotal < coupon.min_total:
        return 0
    if coupon.type == Coupon.CouponType.PERCENT:
        discount = int(subtotal * coupon.value / 100)
    else:
        discount = coupon.value
    coupon.used += 1
    coupon.save(update_fields=["used"])
    return min(discount, subtotal)


def finalize_payment(payment: Payment, status_result: str, raw: dict):
    payment.raw = {**(payment.raw or {}), **raw}
    order = payment.order
    if status_result == "approved":
        payment.status = Payment.Status.APPROVED
        if payment.payment_kind == "deposit":
            order.status = Order.Status.DEPOSIT_PAID
            note = f"Abono pagado (${payment.amount})"
        elif payment.payment_kind == "balance":
            order.status = Order.Status.PAID
            order.balance_due = 0
            note = "Saldo pagado"
        else:
            order.status = Order.Status.PAID
            note = "Pago aprobado"
        OrderEvent.objects.create(order=order, status=order.status, note=note)
    elif status_result == "rejected":
        payment.status = Payment.Status.REJECTED
        OrderEvent.objects.create(order=order, status=order.status, note="Pago rechazado")
    else:
        payment.status = Payment.Status.PENDING
    payment.save()
    order.save()
    if payment.status == Payment.Status.APPROVED:
        send_order_email(order)


def send_order_email(order: Order):
    from django.core.mail import send_mail
    from django.conf import settings

    subject = f"Pedido {order.number} — Living Love"
    body = (
        f"Hola,\n\nRecibimos tu pedido {order.number}.\n"
        f"Total: ${order.total:,}\nEstado: {order.get_status_display()}\n\n"
        f"Gracias por confiar en Living Love."
    ).replace(",", ".")
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [order.email], fail_silently=True)
