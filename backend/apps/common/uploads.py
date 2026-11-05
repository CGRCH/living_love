import os
from typing import Iterable

from django.core.exceptions import ValidationError

MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_PDF_BYTES = 10 * 1024 * 1024
MAX_CSV_BYTES = 2 * 1024 * 1024

ALLOWED_IMAGE_CONTENT_TYPES = frozenset(
    {"image/jpeg", "image/png", "image/webp", "image/gif"}
)
ALLOWED_PDF_CONTENT_TYPES = frozenset({"application/pdf"})
ALLOWED_CSV_CONTENT_TYPES = frozenset(
    {"text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"}
)


def _safe_basename(name: str) -> str:
    base = os.path.basename(name or "upload")
    if ".." in base or base.startswith("/") or base.startswith("\\"):
        raise ValidationError("Nombre de archivo inválido.")
    return base


def _read_head(uploaded, n: int = 16) -> bytes:
    pos = uploaded.tell() if hasattr(uploaded, "tell") else None
    head = uploaded.read(n)
    if pos is not None:
        uploaded.seek(pos)
    return head or b""


def _detect_image_kind(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head.startswith(b"GIF87a") or head.startswith(b"GIF89a"):
        return "image/gif"
    if head[:4] == b"RIFF" and len(head) >= 12 and head[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_upload(
    uploaded,
    *,
    allowed_content_types: Iterable[str],
    max_bytes: int,
    kind: str,
    require_magic: bool = False,
) -> str:
    if not uploaded:
        raise ValidationError(f"Archivo {kind} requerido.")
    _safe_basename(getattr(uploaded, "name", ""))
    size = getattr(uploaded, "size", None)
    if size is not None and size > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise ValidationError(f"El archivo supera el tamaño máximo ({mb} MB).")
    content_type = (getattr(uploaded, "content_type", "") or "").split(";")[0].strip().lower()
    allowed = {c.lower() for c in allowed_content_types}
    if content_type and content_type not in allowed:
        raise ValidationError("Tipo de archivo no permitido.")

    if kind == "imagen" or require_magic:
        head = _read_head(uploaded)
        detected = _detect_image_kind(head)
        if kind == "imagen":
            if not detected:
                raise ValidationError("La imagen no es JPEG, PNG, WebP o GIF válido.")
            if content_type and content_type not in allowed and detected not in allowed:
                raise ValidationError("Tipo de imagen no permitido.")
        if kind == "pdf":
            if not head.startswith(b"%PDF"):
                raise ValidationError("El archivo no parece un PDF válido.")
    return _safe_basename(getattr(uploaded, "name", kind))


def validate_image_upload(uploaded) -> str:
    return validate_upload(
        uploaded,
        allowed_content_types=ALLOWED_IMAGE_CONTENT_TYPES,
        max_bytes=MAX_IMAGE_BYTES,
        kind="imagen",
        require_magic=True,
    )


def validate_pdf_upload(uploaded) -> str:
    return validate_upload(
        uploaded,
        allowed_content_types=ALLOWED_PDF_CONTENT_TYPES,
        max_bytes=MAX_PDF_BYTES,
        kind="pdf",
    )


def validate_csv_upload(uploaded) -> str:
    return validate_upload(
        uploaded,
        allowed_content_types=ALLOWED_CSV_CONTENT_TYPES,
        max_bytes=MAX_CSV_BYTES,
        kind="CSV",
    )
