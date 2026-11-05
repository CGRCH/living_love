import pytest
import uuid
from datetime import timedelta
from django.test import override_settings
from rest_framework.test import APIClient

from apps.catalog.models import Product
from apps.orders.models import Order, generate_order_number
from apps.payments.models import Payment, PaymentProviderConfig


@pytest.mark.django_db
def test_calculate_price_route(client):
    from apps.catalog.models import Category

    cat = Category.objects.create(name="Test", slug="test-cat", is_active=True)
    product = Product.objects.create(
        name="Test",
        slug="test-prod",
        category=cat,
        base_price=10000,
        is_active=True,
    )
    res = client.post(
        "/api/products/calculate-price/",
        {"product_id": product.id, "options": {}},
        content_type="application/json",
    )
    assert res.status_code == 200
    assert res.json()["unit_price"] == 10000


@pytest.mark.django_db
def test_order_number_sequential():
    n1 = generate_order_number()
    Order.objects.create(
        email="a@test.cl",
        phone="+56911111111",
        number=n1,
        subtotal=1000,
        total=1000,
    )
    n2 = generate_order_number()
    assert n1.rsplit("-", 1)[0] == n2.rsplit("-", 1)[0]
    assert int(n2.rsplit("-", 1)[-1]) == int(n1.rsplit("-", 1)[-1]) + 1


@pytest.mark.django_db
def test_cart_invalid_product_returns_404(client):
    res = client.post(
        "/api/cart/items/",
        {"product_id": 999999, "qty": 1, "options": {}},
        content_type="application/json",
        HTTP_X_CART_SESSION=str(uuid.uuid4()),
    )
    assert res.status_code == 404


@pytest.mark.django_db
def test_cart_invalid_qty_returns_400(client):
    product = Product.objects.filter(is_active=True, price_mode="show_price").first()
    if not product:
        pytest.skip("sin producto")
    res = client.post(
        "/api/cart/items/",
        {"product_id": product.id, "qty": "abc", "options": {}},
        content_type="application/json",
        HTTP_X_CART_SESSION=str(uuid.uuid4()),
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_shipping_quote_invalid_commune(client):
    res = client.get("/api/shipping/quote/?commune=abc")
    assert res.status_code == 400


@pytest.mark.django_db
@override_settings(DEBUG=False, PAYMENT_WEBHOOK_SECRET="test-secret")
def test_webhook_rejects_without_secret(client):
    PaymentProviderConfig.objects.update_or_create(
        code="webpay",
        defaults={"display_name": "Webpay", "is_enabled": True, "mode": "simulated"},
    )
    order = Order.objects.create(
        email="x@test.cl",
        phone="+569",
        subtotal=1000,
        total=1000,
        amount_due_now=1000,
    )
    payment = Payment.objects.create(
        order=order,
        provider="webpay",
        amount=1000,
        status=Payment.Status.PENDING,
        external_id="ext-123",
    )
    res = client.post(
        "/api/payments/webpay/webhook/",
        {"payment_id": payment.id, "action": "approve"},
        content_type="application/json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
@override_settings(DEBUG=False, PAYMENTS_ALLOW_SIMULATED_CONFIRM=False)
def test_simulated_confirm_blocked_in_production(client):
    order = Order.objects.create(
        email="x@test.cl",
        phone="+569",
        subtotal=1000,
        total=1000,
        amount_due_now=1000,
    )
    payment = Payment.objects.create(
        order=order,
        provider="simulated",
        amount=1000,
        status=Payment.Status.PENDING,
        external_id="tok",
    )
    res = client.post(f"/api/payments/simulated/{payment.id}/confirm/", {"action": "approve"})
    assert res.status_code == 403


@pytest.mark.django_db
def test_cors_allows_cart_session_header(client):
    res = client.options(
        "/api/cart/",
        HTTP_ORIGIN="http://localhost:3000",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="x-cart-session",
    )
    assert res.status_code == 200
    allow = res.get("Access-Control-Allow-Headers", "")
    assert "x-cart-session" in allow.lower()


@pytest.mark.django_db
def test_coupon_preview_valid(client):
    from apps.store_settings.models import Coupon
    from django.utils import timezone

    now = timezone.now()
    Coupon.objects.create(
        code="TEST10",
        type="fixed",
        value=5000,
        min_total=1000,
        valid_from=now,
        valid_to=now + timedelta(days=1),
        is_active=True,
    )
    from apps.catalog.models import Category

    cat = Category.objects.create(name="Cup", slug="cup-cat", is_active=True)
    product = Product.objects.create(
        name="Cup Prod",
        slug="cup-prod",
        category=cat,
        base_price=5000,
        is_active=True,
    )
    session = str(uuid.uuid4())
    client.post(
        "/api/cart/items/",
        {"product_id": product.id, "qty": 2, "options": {}},
        content_type="application/json",
        HTTP_X_CART_SESSION=session,
    )
    res = client.post(
        "/api/cart/apply-coupon/",
        {"coupon_code": "TEST10"},
        content_type="application/json",
        HTTP_X_CART_SESSION=session,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["discount"] == 5000


@pytest.mark.django_db
def test_coupon_preview_invalid(client):
    res = client.post(
        "/api/cart/apply-coupon/",
        {"coupon_code": "NOEXISTE"},
        content_type="application/json",
        HTTP_X_CART_SESSION=str(uuid.uuid4()),
    )
    assert res.status_code == 200
    assert res.json()["valid"] is False


@pytest.mark.django_db
def test_admin_payment_provider_toggle(client):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    User.objects.create_user(
        email="adm@test.cl",
        password="test12345",
        role=User.Role.ADMIN,
    )
    login = client.post(
        "/api/auth/token/",
        {"email": "adm@test.cl", "password": "test12345"},
        content_type="application/json",
    )
    token = login.json()["access"]
    cfg, _ = PaymentProviderConfig.objects.update_or_create(
        code="flow",
        defaults={"display_name": "Flow", "is_enabled": False, "mode": "simulated"},
    )
    before = cfg.is_enabled
    res = client.patch(
        "/api/admin/payment-providers/",
        {"code": "flow", "is_enabled": not before},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert res.status_code == 200
    cfg.refresh_from_db()
    assert cfg.is_enabled is (not before)
