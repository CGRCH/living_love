from django.db import models


class TaxDocumentSettings(models.Model):
    boleta_enabled = models.BooleanField(default=True)
    factura_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Tax document settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class TaxDocument(models.Model):
    class DocType(models.TextChoices):
        BOLETA = "boleta", "Boleta"
        FACTURA = "factura", "Factura"

    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="tax_documents")
    type = models.CharField(max_length=10, choices=DocType.choices)
    folio = models.CharField(max_length=40, blank=True)
    pdf = models.FileField(upload_to="tax_documents/", blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.type} {self.folio or self.id}"
