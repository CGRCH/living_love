from django.db import models
from django.utils import timezone


def generate_order_number():
    prefix = timezone.now().strftime("%y%m")
    last = (
        Order.objects.filter(number__startswith=f"LL-{prefix}")
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    seq = 1
    if last:
        try:
            seq = int(last.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    return f"LL-{prefix}{seq:04d}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        PAID = "paid", "Pagado"
        DEPOSIT_PAID = "deposit_paid", "Abono pagado"
        IN_WORKSHOP = "in_workshop", "En taller"
        READY = "ready", "Listo"
        SHIPPED = "shipped", "Despachado"
        DELIVERED = "delivered", "Entregado"
        CANCELLED = "cancelled", "Cancelado"
        REFUNDED = "refunded", "Reembolsado"

    class ShippingMethod(models.TextChoices):
        DELIVERY = "delivery", "Despacho"
        PICKUP = "pickup", "Retiro en taller"

    class DocType(models.TextChoices):
        BOLETA = "boleta", "Boleta"
        FACTURA = "factura", "Factura"

    number = models.CharField(max_length=20, unique=True, default=generate_order_number)
    user = models.ForeignKey(
        "users.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders"
    )
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    shipping_address = models.JSONField(default=dict)
    shipping_method = models.CharField(
        max_length=20, choices=ShippingMethod.choices, default=ShippingMethod.DELIVERY
    )
    shipping_cost = models.PositiveIntegerField(default=0)
    shipping_pending_coordination = models.BooleanField(default=False)
    subtotal = models.PositiveIntegerField(default=0)
    discount = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    deposit_amount = models.PositiveIntegerField(default=0)
    balance_due = models.PositiveIntegerField(default=0)
    amount_due_now = models.PositiveIntegerField(default=0)
    doc_type = models.CharField(max_length=10, choices=DocType.choices, default=DocType.BOLETA)
    billing = models.JSONField(null=True, blank=True)
    quote = models.ForeignKey(
        "quotes.Quote", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders"
    )
    coupon_code = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", null=True, on_delete=models.SET_NULL, related_name="order_items"
    )
    name_snapshot = models.CharField(max_length=200)
    options = models.JSONField(default=dict)
    unit_price = models.PositiveIntegerField()
    qty = models.PositiveIntegerField(default=1)


class OrderEvent(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="events")
    status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    by = models.ForeignKey("users.User", null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
