import hashlib
import hmac
import os

from django.conf import settings


def _constant_time_equal(a: str, b: str) -> bool:
    return hmac.compare_digest(a or "", b or "")


def _webhook_secret_for(provider_code: str) -> str:
    code = (provider_code or "").upper().replace("-", "_")
    env_name = f"PAYMENT_WEBHOOK_SECRET_{code}"
    specific = (getattr(settings, env_name, None) or os.environ.get(env_name, "") or "").strip()
    if specific:
        return specific
    return (getattr(settings, "PAYMENT_WEBHOOK_SECRET", "") or "").strip()


def _verify_hmac_body(request, secret: str) -> bool:
    if not secret:
        return False
    signature = (
        request.headers.get("X-Webhook-Signature")
        or request.headers.get("X-Payment-Webhook-Signature")
        or request.headers.get("X-Signature")
        or ""
    ).strip()
    if not signature:
        return False
    body = request.body or b""
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    candidates = {digest, f"sha256={digest}", f"v1={digest}"}
    if signature in candidates:
        return True
    return _constant_time_equal(signature, digest)


def _verify_mercadopago(request, secret: str) -> bool:
    x_sig = (request.headers.get("X-Signature") or request.headers.get("x-signature") or "").strip()
    x_request_id = (
        request.headers.get("X-Request-Id") or request.headers.get("x-request-id") or ""
    ).strip()
    if not secret or not x_sig or not x_request_id:
        return False
    parts = {}
    for chunk in x_sig.split(","):
        if "=" in chunk:
            k, v = chunk.split("=", 1)
            parts[k.strip()] = v.strip()
    ts = parts.get("ts", "")
    v1 = parts.get("v1", "")
    if not v1:
        return False
    manifest = f"id:{x_request_id};request-id:{x_request_id};ts:{ts};"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return _constant_time_equal(v1, expected)


def _verify_shared_secret_header(request, secret: str) -> bool:
    if not secret:
        return False
    header = (request.headers.get("X-Payment-Webhook-Secret") or "").strip()
    return _constant_time_equal(header, secret)


def verify_payment_webhook(request, provider) -> bool:
    provider_code = getattr(provider, "code", "") or ""
    secret = _webhook_secret_for(provider_code)

    if provider_code == "mercadopago" and _verify_mercadopago(request, secret):
        return True

    if _verify_hmac_body(request, secret):
        return True

    if _verify_shared_secret_header(request, secret):
        return True

    if secret:
        return False

    if settings.DEBUG:
        header = (request.headers.get("X-Payment-Webhook-Secret") or "").strip()
        return header in ("", "dev-webhook-secret")

    return False


def resolve_payment_from_payload(provider_code: str, payload: dict):
    from apps.payments.models import Payment

    external_id = (
        payload.get("checkout_id")
        or payload.get("external_id")
        or payload.get("token")
        or payload.get("TBK_TOKEN")
    )
    if external_id:
        payment = Payment.objects.filter(
            provider=provider_code, external_id=str(external_id)
        ).first()
        if payment:
            return payment

    if settings.DEBUG and payload.get("payment_id"):
        return Payment.objects.filter(id=payload.get("payment_id"), provider=provider_code).first()
    return None
