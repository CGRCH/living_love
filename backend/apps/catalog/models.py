from django.db import models


class Category(models.Model):
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Fabric(models.Model):
    name = models.CharField(max_length=120)
    family = models.CharField(max_length=80)
    hex = models.CharField(max_length=7, blank=True)
    image = models.ImageField(upload_to="fabrics/", blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    class PriceMode(models.TextChoices):
        SHOW_PRICE = "show_price", "Mostrar precio"
        QUOTE_ONLY = "quote_only", "Solo cotización"

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    base_price = models.PositiveIntegerField(default=0)
    compare_at_price = models.PositiveIntegerField(null=True, blank=True)
    price_mode = models.CharField(
        max_length=20, choices=PriceMode.choices, default=PriceMode.SHOW_PRICE
    )
    lead_time_text = models.CharField(max_length=120, default="15–20 días hábiles")
    stock = models.PositiveIntegerField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_demo = models.BooleanField(default=False)
    requires_deposit = models.BooleanField(
        default=False,
        help_text="Si es a medida, cobrar abono del 50% en checkout",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class OptionGroup(models.Model):
    class GroupType(models.TextChoices):
        SINGLE = "single", "Single"
        MULTI = "multi", "Multi"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="option_groups")
    name = models.CharField(max_length=80)
    type = models.CharField(max_length=10, choices=GroupType.choices, default=GroupType.SINGLE)
    required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class OptionValue(models.Model):
    group = models.ForeignKey(OptionGroup, on_delete=models.CASCADE, related_name="values")
    label = models.CharField(max_length=120)
    swatch_hex = models.CharField(max_length=7, blank=True)
    swatch_image = models.ImageField(upload_to="swatches/", blank=True)
    fabric = models.ForeignKey(Fabric, null=True, blank=True, on_delete=models.SET_NULL)
    price_delta = models.IntegerField(default=0)
    triggers_quote = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
