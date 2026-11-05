from django.db import models
from django.utils import timezone


def generate_quote_number():
    prefix = timezone.now().strftime("%y%m")
    last = (
        Quote.objects.filter(number__startswith=f"CQ-{prefix}")
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
    return f"CQ-{prefix}{seq:04d}"


class Quote(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Nueva"
        ANSWERED = "answered", "Respondida"
        ACCEPTED = "accepted", "Aceptada"
        REJECTED = "rejected", "Rechazada"
        EXPIRED = "expired", "Expirada"
        CONVERTED = "converted", "Convertida"

    number = models.CharField(max_length=20, unique=True, default=generate_quote_number)
    user = models.ForeignKey(
        "users.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="quotes"
    )
    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    product = models.ForeignKey(
        "catalog.Product", null=True, blank=True, on_delete=models.SET_NULL, related_name="quotes"
    )
    options = models.JSONField(default=dict)
    message = models.TextField(blank=True)
    attachments = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    quoted_amount = models.PositiveIntegerField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    payment_token = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.number
