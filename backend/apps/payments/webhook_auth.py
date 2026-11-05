from django.conf import settings


def verify_payment_webhook(request, provider) -> bool:
    secret = (getattr(settings, "PAYMENT_WEBHOOK_SECRET", "") or "").strip()
    header = (request.headers.get("X-Payment-Webhook-Secret") or "").strip()

    if secret:
        return header == secret

    if settings.DEBUG:
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
        payment = Payment.objects.filter(provider=provider_code, external_id=str(external_id)).first()
        if payment:
            return payment

    if settings.DEBUG and payload.get("payment_id"):
        return Payment.objects.filter(id=payload.get("payment_id"), provider=provider_code).first()
    return None
