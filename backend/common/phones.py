import re

from django.core.exceptions import ValidationError

_DIGIT_TRANSLATION = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
_SEPARATORS = re.compile(r"[\s\-().]")


def normalize_afghan_phone(value, *, allow_blank=False):
    """Return an Afghan mobile number in compact E.164 form."""
    normalized = (value or "").strip().translate(_DIGIT_TRANSLATION)
    if not normalized:
        if allow_blank:
            return ""
        raise ValidationError("Enter an Afghan mobile number.")
    normalized = _SEPARATORS.sub("", normalized)
    if normalized.startswith("0093"):
        normalized = f"+93{normalized[4:]}"
    elif normalized.startswith("93"):
        normalized = f"+{normalized}"
    elif normalized.startswith("07"):
        normalized = f"+93{normalized[1:]}"
    elif normalized.startswith("7"):
        normalized = f"+93{normalized}"
    if not re.fullmatch(r"\+937\d{8}", normalized):
        raise ValidationError("Enter a valid Afghan mobile number, for example +93 700 123 456.")
    return normalized
