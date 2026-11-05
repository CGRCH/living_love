from django.db import models


class PaymentProviderConfig(models.Model):
    class ProviderCode(models.TextChoices):
        SIMULATED = "simulated", "Simulado"
        WEBPAY = "webpay", "Webpay Plus"
        MERCADOPAGO = "mercadopago", "Mercado Pago"
        FLOW = "flow", "Flow"
        SUMUP = "sumup", "SumUp"

    class Mode(models.TextChoices):
        SIMULATED = "simulated", "Simulado"
        SANDBOX = "sandbox", "Sandbox"
        LIVE = "live", "Live"

    code = models.CharField(max_length=20, choices=ProviderCode.choices, unique=True)
    display_name = models.CharField(max_length=80)
    is_enabled = models.BooleanField(default=False)
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.SIMULATED)
    credentials_encrypted = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "code"]

    def __str__(self):
        return self.display_name


class Payment(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "Creado"
        PENDING = "pending", "Pendiente"
        APPROVED = "approved", "Aprobado"
        REJECTED = "rejected", "Rechazado"
        REFUNDED = "refunded", "Reembolsado"

    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20)
    amount = models.PositiveIntegerField()
    payment_kind = models.CharField(
        max_length=20,
        default="full",
        help_text="full | deposit | balance",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    external_id = models.CharField(max_length=200, blank=True)
    raw = models.JSONField(default=dict, blank=True)
    idempotency_key = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
