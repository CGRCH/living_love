from django.db import models


class Cart(models.Model):
    user = models.ForeignKey(
        "users.User", null=True, blank=True, on_delete=models.CASCADE, related_name="carts"
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart {self.id}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    options = models.JSONField(default=dict)
    unit_price = models.PositiveIntegerField()
    qty = models.PositiveIntegerField(default=1)

    @property
    def line_total(self):
        return self.unit_price * self.qty
