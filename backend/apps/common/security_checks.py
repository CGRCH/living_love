from django.conf import settings
from django.core.checks import Warning, register


@register()
def check_production_security(app_configs, **kwargs):
    errors = []
    if settings.DEBUG:
        return errors

    sk = getattr(settings, "SECRET_KEY", "") or ""
    if len(sk) < 50:
        errors.append(
            Warning(
                "SECRET_KEY demasiado corta para producción (use ≥50 caracteres aleatorios).",
                id="livinglove.W001",
            )
        )

    hosts = getattr(settings, "ALLOWED_HOSTS", [])
    if not hosts or hosts == ["*"]:
        errors.append(
            Warning(
                "ALLOWED_HOSTS debe listar dominios explícitos en producción.",
                id="livinglove.W002",
            )
        )

    cors = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    if not cors:
        errors.append(
            Warning(
                "CORS_ALLOWED_ORIGINS vacío: el frontend no podrá llamar a la API.",
                id="livinglove.W003",
            )
        )

    if not (getattr(settings, "PAYMENT_WEBHOOK_SECRET", "") or "").strip():
        errors.append(
            Warning(
                "PAYMENT_WEBHOOK_SECRET no configurado: webhooks de pago rechazados (fail-closed).",
                id="livinglove.W004",
            )
        )

    if getattr(settings, "PAYMENTS_ALLOW_SIMULATED_CONFIRM", False):
        errors.append(
            Warning(
                "PAYMENTS_ALLOW_SIMULATED_CONFIRM=1 en producción permite "
                "confirmar pagos simulados.",
                id="livinglove.W005",
            )
        )

    return errors
