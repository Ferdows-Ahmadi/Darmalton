from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

ALLOWED_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
}


def validate_prescription_document(upload):
    extension = Path(upload.name).suffix.lower()
    expected_type = ALLOWED_TYPES.get(extension)
    if not expected_type:
        raise ValidationError("فقط فایل‌های JPG، PNG یا PDF پذیرفته می‌شود.")
    if upload.size > settings.PRESCRIPTION_MAX_UPLOAD_BYTES:
        raise ValidationError("حجم نسخه نباید بیشتر از ۱۰ مگابایت باشد.")
    if upload.size == 0:
        raise ValidationError("فایل نسخه خالی است.")

    declared_type = (getattr(upload, "content_type", "") or "").lower()
    if declared_type != expected_type:
        raise ValidationError("نوع فایل با پسوند نسخه مطابقت ندارد.")

    upload.seek(0)
    header = upload.read(16)
    upload.seek(max(upload.size - 2048, 0))
    trailer = upload.read(2048)
    upload.seek(0)
    try:
        if expected_type == "image/jpeg":
            if not header.startswith(b"\xff\xd8\xff"):
                raise ValidationError("فایل JPEG معتبر نیست.")
            Image.open(upload).verify()
        elif expected_type == "image/png":
            if not header.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValidationError("فایل PNG معتبر نیست.")
            Image.open(upload).verify()
        elif not header.startswith(b"%PDF-") or b"%%EOF" not in trailer:
            raise ValidationError("فایل PDF معتبر نیست.")
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise ValidationError("تصویر نسخه قابل خواندن نیست.") from exc
    finally:
        upload.seek(0)
