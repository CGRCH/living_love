from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email requerido")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", User.Role.ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        STORE = "store", "Tienda"
        ADMIN = "admin", "Administración"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STORE)
    first_name = models.CharField(max_length=120, blank=True)
    last_name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def __str__(self):
        return self.email


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses", null=True, blank=True)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    street = models.CharField(max_length=200)
    number = models.CharField(max_length=20, blank=True)
    apt = models.CharField(max_length=40, blank=True)
    region = models.ForeignKey("shipping.Region", on_delete=models.PROTECT)
    commune = models.ForeignKey("shipping.Commune", on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street} {self.number}, {self.commune.name}"


class BillingProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="billing_profiles")
    rut = models.CharField(max_length=12)
    razon_social = models.CharField(max_length=200)
    giro = models.CharField(max_length=200)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.razon_social
