from django.db import models


class HomeContent(models.Model):
    section = models.CharField(max_length=40)
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.TextField(blank=True)
    image = models.ImageField(upload_to="home/", blank=True)
    cta_text = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["section", "order"]


class Testimonial(models.Model):
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=120, blank=True)
    text = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    product = models.ForeignKey(
        "catalog.Product", null=True, blank=True, on_delete=models.SET_NULL
    )
    image = models.ImageField(upload_to="testimonials/", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-id"]
