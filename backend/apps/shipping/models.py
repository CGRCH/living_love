from django.db import models


class Region(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Commune(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="communes")
    name = models.CharField(max_length=120)

    class Meta:
        unique_together = ("region", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class ShippingRate(models.Model):
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="shipping_rates")
    commune = models.ForeignKey(
        Commune, on_delete=models.CASCADE, null=True, blank=True, related_name="shipping_rates"
    )
    price = models.PositiveIntegerField(default=0)
    lead_days = models.PositiveIntegerField(default=3)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("region", "commune")

    def __str__(self):
        if self.commune:
            return f"{self.commune.name}: ${self.price}"
        return f"{self.region.name} (regional): ${self.price}"
