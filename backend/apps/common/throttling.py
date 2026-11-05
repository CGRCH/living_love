from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class AuthLoginThrottle(AnonRateThrottle):
    scope = "auth_login"


class AuthRegisterThrottle(AnonRateThrottle):
    scope = "auth_register"


class QuoteCreateThrottle(AnonRateThrottle):
    scope = "quote_create"


class CheckoutThrottle(AnonRateThrottle):
    scope = "checkout"


class PaymentStartThrottle(AnonRateThrottle):
    scope = "payment_start"


class PaymentWebhookThrottle(SimpleRateThrottle):
    scope = "payment_webhook"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        provider = getattr(view, "kwargs", {}).get("provider_code", "any")
        return self.cache_format % {"scope": self.scope, "ident": f"{ident}:{provider}"}
