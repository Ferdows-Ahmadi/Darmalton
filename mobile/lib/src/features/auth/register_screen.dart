import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth_gate.dart';
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/phone_number.dart';
import '../../core/widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({this.returnTo, super.key});

  final String? returnTo;

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  void _finishAuthentication() {
    context.go(safeReturnLocation(widget.returnTo));
  }

  @override
  void dispose() {
    for (final controller in [_first, _last, _email, _phone, _password]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).register({
      'first_name': _first.text.trim(),
      'last_name': _last.text.trim(),
      'email': _email.text.trim(),
      'phone': _phone.text.trim().isEmpty
          ? null
          : normalizeAfghanPhone(_phone.text),
      'password': _password.text,
    });
    if (mounted && ref.read(authProvider).value != null) {
      _finishAuthentication();
    }
  }

  Future<void> _submitGoogle() async {
    await ref.read(authProvider.notifier).loginWithGoogle();
    if (mounted && ref.read(authProvider).value != null) {
      _finishAuthentication();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final googleConfigured = ref.watch(googleIdentityProvider).isConfigured;
    return Scaffold(
      appBar: AppBar(title: const Text('ایجاد حساب')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: DarmaltonWordmark(height: 52)),
                  const SizedBox(height: 18),
                  Text(
                    'حساب کاربری خود را بسازید',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'برای ثبت سفارش، آدرس و شماره تماس معتبر وارد کنید.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: DarmaltonColors.muted),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _first,
                          decoration: InputDecoration(
                            labelText: DariStrings.translate('نام'),
                            prefixIcon: const Icon(
                              Icons.person_outline_rounded,
                            ),
                          ),
                          validator: _required,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _last,
                          decoration: InputDecoration(
                            labelText: DariStrings.translate('نام خانوادگی'),
                          ),
                          validator: _required,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _email,
                    textDirection: TextDirection.ltr,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: DariStrings.translate('ایمیل'),
                      prefixIcon: const Icon(Icons.email_outlined),
                    ),
                    validator: (value) => value != null && value.contains('@')
                        ? null
                        : 'یک ایمیل معتبر وارد کنید.',
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _phone,
                    textDirection: TextDirection.ltr,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: DariStrings.translate('شماره تماس (اختیاری)'),
                      prefixIcon: const Icon(Icons.phone_outlined),
                    ),
                    validator: (value) =>
                        validateAfghanPhone(value, optional: true),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _password,
                    textDirection: TextDirection.ltr,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: DariStrings.translate('رمز عبور'),
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      suffixIcon: IconButton(
                        tooltip: DariStrings.translate(
                          _obscure ? 'نمایش رمز' : 'پنهان کردن رمز',
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(
                          _obscure
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                      ),
                    ),
                    validator: (value) => (value?.length ?? 0) >= 8
                        ? null
                        : 'رمز عبور حداقل ۸ نویسه باشد.',
                  ),
                  if (state.hasError)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        '${state.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: DarmaltonColors.danger),
                      ),
                    ),
                  const SizedBox(height: 20),
                  GradientButton(
                    label: state.isLoading
                        ? 'در حال ایجاد حساب...'
                        : 'ایجاد حساب',
                    icon: Icons.person_add_alt_1_rounded,
                    onPressed: state.isLoading ? null : _submit,
                    loading: state.isLoading,
                  ),
                  const SizedBox(height: 18),
                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('یا'),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 14),
                  GoogleAuthButton(
                    label: 'ایجاد حساب با گوگل',
                    enabled: googleConfigured,
                    loading: state.isLoading,
                    onPressed: _submitGoogle,
                  ),
                  if (!googleConfigured) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'ورود با گوگل در این نسخه تنظیم نشده است.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: DarmaltonColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: state.isLoading
                        ? null
                        : () => context.go(
                            authenticationLocation(
                              'login',
                              safeReturnLocation(widget.returnTo),
                            ),
                          ),
                    child: const Text('قبلاً حساب دارید؟ ورود'),
                  ),
                  TextButton(
                    onPressed: state.isLoading
                        ? null
                        : () => context.go('/catalogue'),
                    child: const Text('ادامه بدون ایجاد حساب'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'این بخش الزامی است.' : null;
}
