from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

CMS_IMAGE_TYPES = {"JPEG", "PNG", "WEBP"}
CMS_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
CMS_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_cms_image_size(value):
    if value.size > 5 * 1024 * 1024:
        raise ValidationError("CMS images must be 5 MB or smaller.")


def validate_cms_image(value):
    position = value.tell() if hasattr(value, "tell") else 0
    try:
        value.seek(0)
        with Image.open(value) as image:
            image.verify()
        value.seek(0)
        with Image.open(value) as image:
            image_format = (image.format or "").upper()
            width, height = image.size
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("Upload a valid JPEG, PNG, or WebP image.") from exc
    finally:
        if hasattr(value, "seek"):
            value.seek(position)

    if image_format not in CMS_IMAGE_TYPES:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.")
    if width < 128 or height < 128:
        raise ValidationError("CMS images must be at least 128 by 128 pixels.")
    if width > 6000 or height > 6000:
        raise ValidationError("CMS images must not exceed 6000 pixels per side.")


def validate_action_url(value):
    if not value:
        return
    if value.startswith("/") and not value.startswith("//"):
        return
    parsed = urlparse(value)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return
    raise ValidationError("Use an internal path or an absolute HTTP(S) URL.")


def validate_cms_image_extension(value):
    if Path(value.name).suffix.lower() not in CMS_IMAGE_EXTENSIONS:
        raise ValidationError("Upload a JPEG, PNG, or WebP image.")
