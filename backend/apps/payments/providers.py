from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from django.conf import settings


@dataclass
class PaymentResult:
    redirect_url: str
    external_id: str
    raw: dict[str, Any]


class PaymentProvider:
    code: str = "base"

    def __init__(self, config):
        self.config = config

    def create(self, payment, order, *, success_url: str, cancel_url: str) -> PaymentResult:
        raise NotImplementedError

    def confirm(self, payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        """Return (status, raw). status: approved|rejected|pending"""
        raise NotImplementedError

    def refund(self, payment) -> bool:
        return False


class SimulatedProvider(PaymentProvider):
    code = "simulated"

    def create(self, payment, order, *, success_url: str, cancel_url: str) -> PaymentResult:
        token = payment.idempotency_key or str(uuid4())
        payment.external_id = token
        redirect = f"{settings.FRONTEND_URL}/pago/simulado?payment={payment.id}&token={token}"
        return PaymentResult(redirect_url=redirect, external_id=token, raw={"simulated": True})

    def confirm(self, payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        action = payload.get("action", "approve")
        if action == "reject":
            return "rejected", payload
        return "approved", payload


class WebpayProvider(SimulatedProvider):
    code = "webpay"


class MercadoPagoProvider(SimulatedProvider):
    code = "mercadopago"


class FlowProvider(SimulatedProvider):
    code = "flow"


class SumUpProvider(PaymentProvider):
    code = "sumup"

    def create(self, payment, order, *, success_url: str, cancel_url: str) -> PaymentResult:
        import requests

        from apps.common.crypto import decrypt_credentials

        creds = decrypt_credentials(self.config.credentials_encrypted)
        api_key = creds.get("api_key") or settings.SUMUP_API_KEY
        merchant_code = creds.get("merchant_code") or settings.SUMUP_MERCHANT_CODE

        if self.config.mode == "simulated" or not api_key:
            if self.config.mode == "sandbox" and not api_key:
                raise ValueError(
                    "SumUp en modo sandbox requiere credenciales (SUMUP_API_KEY). "
                    "Configure credenciales en admin o use modo simulado."
                )
            sim = SimulatedProvider(self.config)
            sim.code = self.code
            return sim.create(payment, order, success_url=success_url, cancel_url=cancel_url)

        checkout_reference = payment.idempotency_key or f"LL-{order.number}-{payment.id}"
        amount = payment.amount
        payload = {
            "checkout_reference": checkout_reference,
            "amount": amount,
            "currency": "CLP",
            "merchant_code": merchant_code,
            "description": f"Pedido {order.number}",
            "return_url": success_url,
        }
        resp = requests.post(
            "https://api.sumup.com/v0.1/checkouts",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        data = resp.json()
        if resp.status_code >= 400:
            raise ValueError(data.get("message", "Error SumUp"))
        checkout_id = data.get("id", checkout_reference)
        redirect = data.get("redirect_url") or f"{settings.FRONTEND_URL}/pago/sumup?checkout={checkout_id}"
        return PaymentResult(redirect_url=redirect, external_id=str(checkout_id), raw=data)

    def confirm(self, payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        status = payload.get("status") or payload.get("checkout_status")
        if status in ("PAID", "SUCCESSFUL", "approved"):
            return "approved", payload
        if status in ("FAILED", "CANCELLED", "rejected"):
            return "rejected", payload
        return "pending", payload


PROVIDERS = {
    "simulated": SimulatedProvider,
    "webpay": WebpayProvider,
    "mercadopago": MercadoPagoProvider,
    "flow": FlowProvider,
    "sumup": SumUpProvider,
}


def get_provider(config) -> PaymentProvider:
    cls = PROVIDERS.get(config.code, SimulatedProvider)
    return cls(config)
