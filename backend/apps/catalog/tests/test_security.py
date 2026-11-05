import hashlib
import hmac
import uuid

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings

from apps.orders.models import Order
from apps.payments.models import Payment, PaymentProviderConfig


def _cart_session():
    return str(uuid.uuid4())


@pytest.mark.django_db
@override_settings(DEBUG=False, PAYMENTS_ALLOW_SIMULATED_CONFIRM=False)
def test_weak_cart_session_rejected(client):
    res = client.get("/api/cart/", HTTP_X_CART_SESSION="e2e-cart-session")
    assert res.status_code == 400


@pytest.mark.django_db
@override_settings(DEBUG=False, PAYMENT_WEBHOOK_SECRET="test-secret")
def test_webhook_accepts_shared_secret(client):
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
        external_id="ext-sec-1",
    )
    res = client.post(
        "/api/payments/webpay/webhook/",
        {"token": "ext-sec-1", "action": "approve"},
        content_type="application/json",
    )
    assert res.status_code == 403

    res_ok = client.post(
        "/api/payments/webpay/webhook/",
        {"token": "ext-sec-1", "action": "approve"},
        content_type="application/json",
        HTTP_X_PAYMENT_WEBHOOK_SECRET="test-secret",
    )
    assert res_ok.status_code == 200
    payment.refresh_from_db()
    assert payment.status == Payment.Status.APPROVED


@pytest.mark.django_db
@override_settings(DEBUG=False, PAYMENT_WEBHOOK_SECRET="hmac-secret")
def test_webhook_accepts_hmac_signature(client):
    PaymentProviderConfig.objects.update_or_create(
        code="flow",
        defaults={"display_name": "Flow", "is_enabled": True, "mode": "simulated"},
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
        provider="flow",
        amount=1000,
        status=Payment.Status.PENDING,
        external_id="flow-ext",
    )
    body = b'{"token":"flow-ext","action":"approve"}'
    sig = hmac.new(b"hmac-secret", body, hashlib.sha256).hexdigest()
    res = client.post(
        "/api/payments/flow/webhook/",
        body,
        content_type="application/json",
        HTTP_X_WEBHOOK_SIGNATURE=sig,
    )
    assert res.status_code == 200
    payment.refresh_from_db()
    assert payment.status == Payment.Status.APPROVED


@pytest.mark.django_db
def test_customer_cannot_list_admin_orders(client):
    User = get_user_model()
    User.objects.create_user(email="cli@test.cl", password="testpass12345")
    login = client.post(
        "/api/auth/token/",
        {"email": "cli@test.cl", "password": "testpass12345"},
        content_type="application/json",
    )
    token = login.json()["access"]
    res = client.get("/api/admin/orders/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res.status_code == 403


@pytest.mark.django_db
def test_customer_cannot_read_other_order(client):
    User = get_user_model()
    User.objects.create_user(email="a@test.cl", password="testpass12345")
    u2 = User.objects.create_user(email="b@test.cl", password="testpass12345")
    order = Order.objects.create(
        user=u2,
        email="b@test.cl",
        phone="+569",
        subtotal=1000,
        total=1000,
    )
    login = client.post(
        "/api/auth/token/",
        {"email": "a@test.cl", "password": "testpass12345"},
        content_type="application/json",
    )
    token = login.json()["access"]
    res = client.get(f"/api/me/orders/{order.id}/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert res.status_code == 404
