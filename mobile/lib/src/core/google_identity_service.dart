import 'package:google_sign_in/google_sign_in.dart';

class GoogleIdentityException implements Exception {
  const GoogleIdentityException(this.message);

  final String message;

  @override
  String toString() => message;
}

abstract interface class GoogleIdentityService {
  bool get isConfigured;

  Future<String> authenticate();

  Future<void> signOut();
}

class PlatformGoogleIdentityService implements GoogleIdentityService {
  PlatformGoogleIdentityService({String? clientId, GoogleSignIn? googleSignIn})
    : _clientId =
          clientId ?? const String.fromEnvironment('GOOGLE_CLIENT_ID').trim(),
      _googleSignIn = googleSignIn ?? GoogleSignIn.instance;

  final String _clientId;
  final GoogleSignIn _googleSignIn;
  Future<void>? _initialization;

  @override
  bool get isConfigured => _clientId.isNotEmpty;

  Future<void> _initialize() {
    if (!isConfigured) {
      throw const GoogleIdentityException(
        'ورود با گوگل در این نسخه تنظیم نشده است.',
      );
    }
    return _initialization ??= _googleSignIn.initialize(
      // The backend's web OAuth client ID is the ID-token audience on Android
      // and iOS. Platform package registration still belongs in Google Cloud.
      serverClientId: _clientId,
    );
  }

  @override
  Future<String> authenticate() async {
    await _initialize();
    if (!_googleSignIn.supportsAuthenticate()) {
      throw const GoogleIdentityException(
        'ورود با گوگل در این دستگاه پشتیبانی نمی‌شود.',
      );
    }
    try {
      final account = await _googleSignIn.authenticate();
      final token = account.authentication.idToken?.trim();
      if (token == null || token.isEmpty) {
        throw const GoogleIdentityException(
          'گوگل معلومات معتبر ورود را برنگرداند. دوباره کوشش کنید.',
        );
      }
      return token;
    } on GoogleSignInException catch (error) {
      switch (error.code) {
        case GoogleSignInExceptionCode.canceled:
          throw const GoogleIdentityException('ورود با گوگل لغو شد.');
        case GoogleSignInExceptionCode.clientConfigurationError:
        case GoogleSignInExceptionCode.providerConfigurationError:
          throw const GoogleIdentityException(
            'تنظیمات ورود با گوگل کامل نیست. با پشتیبانی تماس بگیرید.',
          );
        case GoogleSignInExceptionCode.interrupted:
        case GoogleSignInExceptionCode.uiUnavailable:
        case GoogleSignInExceptionCode.userMismatch:
        case GoogleSignInExceptionCode.unknownError:
          throw const GoogleIdentityException(
            'ورود با گوگل انجام نشد. دوباره کوشش کنید.',
          );
      }
    }
  }

  @override
  Future<void> signOut() async {
    if (!isConfigured || _initialization == null) return;
    try {
      await _googleSignIn.signOut();
    } on GoogleSignInException {
      // The Darmalton JWT is already cleared by the caller. A stale Google
      // selector session must never prevent local logout.
    }
  }
}
