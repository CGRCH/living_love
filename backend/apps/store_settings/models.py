from django.db import models


class Coupon(models.Model):
    class CouponType(models.TextChoices):
        PERCENT = "percent", "Porcentaje"
        FIXED = "fixed", "Monto fijo"

    code = models.CharField(max_length=40, unique=True)
    type = models.CharField(max_length=10, choices=CouponType.choices)
    value = models.PositiveIntegerField()
    min_total = models.PositiveIntegerField(null=True, blank=True)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    max_uses = models.PositiveIntegerField(default=0)
    used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code


class StoreSettings(models.Model):
    whatsapp = models.CharField(max_length=30, default="+56932222939")
    announcement_text = models.TextField(
        default="DESPACHO GRATIS EN SANTIAGO · ENVÍOS A LA V REGIÓN · FABRICACIÓN PROPIA"
    )
    free_shipping_text = models.CharField(max_length=200, default="Despacho gratis en Santiago")
    return_policy_md = models.TextField(blank=True)
    warranty_text = models.TextField(blank=True)
    trust_return_text = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(default="hola@livinglove.cl")
    instagram = models.CharField(max_length=80, default="@livinglove.cl")
    fabrication_notice = models.CharField(
        max_length=200, default="Fabricación 15–20 días hábiles · Te avisamos por WhatsApp"
    )

    class Meta:
        verbose_name_plural = "Store settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
