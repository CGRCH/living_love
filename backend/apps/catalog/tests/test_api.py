import pytest
from apps.common.rut import validate_rut
from apps.users.models import User


@pytest.mark.django_db
def test_rut_validation():
    assert validate_rut("11.111.111-2") is False
    assert validate_rut("invalid") is False
    assert validate_rut("6.782.391-5") is True


@pytest.mark.django_db
def test_admin_role():
    admin = User.objects.create_user(email="a@test.cl", password="test12345", role=User.Role.ADMIN)
    store = User.objects.create_user(email="b@test.cl", password="test12345")
    assert admin.is_admin_role is True
    assert store.is_admin_role is False


@pytest.mark.django_db
def test_public_settings(client):
    res = client.get("/api/settings/public/")
    assert res.status_code == 200
    assert "payment_providers" in res.json()


@pytest.mark.django_db
def test_admin_dashboard_forbidden(client):
    res = client.get("/api/admin/dashboard/")
    assert res.status_code == 401 or res.status_code == 403


@pytest.mark.django_db
def test_products_list(client):
    res = client.get("/api/products/")
    assert res.status_code == 200
