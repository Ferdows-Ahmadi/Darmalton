const _localizedDigits = '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩';
const _asciiDigits = '01234567890123456789';

String _asciiPhone(String value) {
  var result = value.trim();
  for (var index = 0; index < _localizedDigits.length; index++) {
    result = result.replaceAll(_localizedDigits[index], _asciiDigits[index]);
  }
  return result.replaceAll(RegExp(r'[\s\-().]'), '');
}

String normalizeAfghanPhone(String value, {bool allowBlank = false}) {
  var normalized = _asciiPhone(value);
  if (normalized.isEmpty && allowBlank) return '';
  if (normalized.startsWith('0093')) {
    normalized = '+93${normalized.substring(4)}';
  } else if (normalized.startsWith('93')) {
    normalized = '+$normalized';
  } else if (normalized.startsWith('07')) {
    normalized = '+93${normalized.substring(1)}';
  } else if (normalized.startsWith('7')) {
    normalized = '+93$normalized';
  }
  if (!RegExp(r'^\+937\d{8}$').hasMatch(normalized)) {
    throw const FormatException(
      'شماره معتبر افغانستان را مانند +93 700 123 456 وارد کنید.',
    );
  }
  return normalized;
}

String formatAfghanPhone(String value) {
  try {
    final normalized = normalizeAfghanPhone(value);
    return '${normalized.substring(0, 3)} ${normalized.substring(3, 6)} '
        '${normalized.substring(6, 9)} ${normalized.substring(9)}';
  } on FormatException {
    return value;
  }
}

String? validateAfghanPhone(String? value, {bool optional = false}) {
  try {
    normalizeAfghanPhone(value ?? '', allowBlank: optional);
    return null;
  } on FormatException catch (error) {
    return error.message;
  }
}
