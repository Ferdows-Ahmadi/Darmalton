import pytest
from django.core.exceptions import ValidationError

from common.phones import normalize_afghan_phone


@pytest.mark.parametrize(
    ("value", "expected"),
    (
        ("+93 700 123 456", "+93700123456"),
        ("0700-123-456", "+93700123456"),
        ("0093 700 123 456", "+93700123456"),
        ("۹۳ ۷۰۰ ۱۲۳ ۴۵۶", "+93700123456"),
    ),
)
def test_afghan_phone_normalization(value, expected):
    assert normalize_afghan_phone(value) == expected


@pytest.mark.parametrize("value", ("123", "+93 600 123 456", "+937001234567"))
def test_invalid_afghan_phone_is_rejected(value):
    with pytest.raises(ValidationError):
        normalize_afghan_phone(value)
