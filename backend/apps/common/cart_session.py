import re
from uuid import uuid4

from django.conf import settings

# RFC 4122 UUID (v4-style) or long opaque token from secrets.token_urlsafe
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.I,
)
_OPAQUE_RE = re.compile(r"^[A-Za-z0-9_-]{32,64}$")


def new_cart_session_key() -> str:
    return str(uuid4())


def is_strong_cart_session_key(session_key: str) -> bool:
    key = (session_key or "").strip()
    if not key:
        return False
    if _UUID_RE.match(key):
        return True
    if len(key) >= 32 and _OPAQUE_RE.match(key):
        return True
    return False


def cart_session_relaxed() -> bool:
    """Allow weak client session keys in local dev / CI e2e only."""
    if settings.DEBUG:
        return True
    return bool(getattr(settings, "PAYMENTS_ALLOW_SIMULATED_CONFIRM", False))


def validate_client_cart_session(session_key: str) -> str | None:
    """
    Return an error message if the client-supplied session key must be rejected.
    Empty session keys are allowed (server will mint a new one).
    """
    key = (session_key or "").strip()
    if not key:
        return None
    if is_strong_cart_session_key(key):
        return None
    if cart_session_relaxed():
        return None
    return (
        "Identificador de carro inválido. Recarga la página para obtener uno nuevo."
    )


def mint_session_if_missing(session_key: str) -> str:
    key = (session_key or "").strip()
    if not key:
        return new_cart_session_key()
    err = validate_client_cart_session(key)
    if err:
        raise ValueError(err)
    return key
