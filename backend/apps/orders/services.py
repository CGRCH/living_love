from django.utils import timezone

from apps.orders.models import Order, OrderEvent
from apps.payments.models import Payment
from apps.store_settings.models import Coupon


def _coupon_discount(coupon: Coupon, subtotal: int) -> int:
    if coupon.type == Coupon.CouponType.PERCENT:
        discount = int(subtotal * coupon.value / 100)
    else:
        discount = coupon.value
    return min(discount, subtotal)


def preview_coupon(code: str, subtotal: int) -> tuple[int, str | None]:
    """Validates coupon without incrementing usage."""
    if not code or not str(code).strip():
        return 0, "Ingresa un código de cupón."
    coupon = Coupon.objects.filter(code__iexact=code.strip(), is_active=True).first()
    if not coupon:
        return 0, "Cupón no válido."
    now = timezone.now()
    if coupon.valid_from > now or coupon.valid_to < now:
        return 0, "Este cupón ya no está vigente."
    if coupon.max_uses and coupon.used >= coupon.max_uses:
        return 0, "Este cupón alcanzó el límite de usos."
    if coupon.min_total and subtotal < coupon.min_total:
        return 0, f"Monto mínimo {coupon.min_total:,} CLP.".replace(",", ".")
    return _coupon_discount(coupon, subtotal), None


def apply_coupon(code: str, subtotal: int) -> int:
    if not code:
        return 0
    discount, err = preview_coupon(code, subtotal)
    if err:
        return 0
    coupon = Coupon.objects.filter(code__iexact=code.strip(), is_active=True).first()
    if not coupon:
        return 0
    coupon.used += 1
    coupon.save(update_fields=["used"])
    return discount


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
    from django.conf import settings
    from django.core.mail import EmailMessage, get_connection

    subject = f"Pedido {order.number} — Living Love"
    body = (
        f"Hola,\n\nRecibimos tu pedido {order.number}.\n"
        f"Total: ${order.total:,}\nEstado: {order.get_status_display()}\n\n"
        f"Gracias por confiar en Living Love."
    ).replace(",", ".")
    timeout = getattr(settings, "EMAIL_TIMEOUT", 10)
    connection = get_connection(fail_silently=True, timeout=timeout)
    EmailMessage(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [order.email],
        connection=connection,
    ).send()
