import pytest
from django.contrib.auth import get_user_model

from apps.orders.models import Order
from apps.payments.models import PaymentProviderConfig

User = get_user_model()


@pytest.mark.django_db
def test_address_crud(client):
    user = User.objects.create_user(email="c@test.cl", password="test12345")
    login = client.post("/api/auth/token/", {"email": "c@test.cl", "password": "test12345"}, content_type="application/json")
    token = login.json()["access"]
    from apps.shipping.models import Commune, Region

    rm, _ = Region.objects.get_or_create(code="RM", defaults={"name": "RM"})
    com, _ = Commune.objects.get_or_create(region=rm, name="Santiago")
    res = client.post(
        "/api/me/addresses/",
        {
            "name": "Casa",
            "phone": "+569",
            "street": "Calle 1",
            "number": "100",
            "region_id": rm.id,
            "commune_id": com.id,
            "is_default": True,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert res.status_code == 201


@pytest.mark.django_db
def test_pay_balance_requires_deposit_state(client):
    user = User.objects.create_user(email="p@test.cl", password="test12345")
    login = client.post("/api/auth/token/", {"email": "p@test.cl", "password": "test12345"}, content_type="application/json")
    token = login.json()["access"]
    PaymentProviderConfig.objects.get_or_create(
        code="simulated",
        defaults={"display_name": "Simulado", "is_enabled": True, "mode": "simulated"},
    )
    order = Order.objects.create(
        user=user,
        email=user.email,
        phone="+569",
        total=1000000,
        balance_due=500000,
        deposit_amount=500000,
        status=Order.Status.DEPOSIT_PAID,
    )
    res = client.post(
        f"/api/me/orders/{order.id}/pay-balance/",
        {"payment_provider": "simulated"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert res.status_code == 200
    assert "payment_redirect" in res.json()
