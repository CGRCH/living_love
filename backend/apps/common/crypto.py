import base64
import json
from typing import Any

from cryptography.fernet import Fernet
from django.conf import settings


def _fernet() -> Fernet:
    key = settings.PAYMENTS_ENCRYPTION_KEY.encode("utf-8")[:32]
    b64 = base64.urlsafe_b64encode(key)
    return Fernet(b64)


def encrypt_credentials(data: dict[str, Any]) -> str:
    payload = json.dumps(data).encode("utf-8")
    return _fernet().encrypt(payload).decode("utf-8")


def decrypt_credentials(token: str) -> dict[str, Any]:
    if not token:
        return {}
    raw = _fernet().decrypt(token.encode("utf-8"))
    return json.loads(raw.decode("utf-8"))
