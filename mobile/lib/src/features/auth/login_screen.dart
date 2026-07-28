import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth_gate.dart';
import '../../core/design_system.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({this.returnTo, super.key});

  final String? returnTo;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  void _finishAuthentication() {
    context.go(safeReturnLocation(widget.returnTo));
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authProvider.notifier)
        .login(_email.text.trim(), _password.text);
    if (!mounted) return;
    final state = ref.read(authProvider);
    if (state.hasValue && state.value != null) _finishAuthentication();
  }

  Future<void> _submitGoogle() async {
    await ref.read(authProvider.notifier).loginWithGoogle();
    if (!mounted) return;
    final state = ref.read(authProvider);
    if (state.hasValue && state.value != null) _finishAuthentication();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);
    final googleConfigured = ref.watch(googleIdentityProvider).isConfigured;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: DarmaltonWordmark(height: 58)),
                    const SizedBox(height: 28),
                    if (widget.returnTo != null) ...[
                      const Text(
                        'برای ادامه کار قبلی وارد حساب شوید؛ پس از ورود به همان بخش برمی‌گردید.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: DarmaltonColors.teal),
                      ),
                      const SizedBox(height: 14),
                    ],
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: DarmaltonColors.mint,
                        borderRadius: BorderRadius.circular(
                          DarmaltonRadius.large,
                        ),
                      ),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 34,
                            backgroundColor: Colors.white,
                            foregroundColor: DarmaltonColors.teal,
                            child: Icon(Icons.lock_open_rounded, size: 34),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'خوش آمدید',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'برای خرید دوا و پیگیری سفارش‌های خود وارد شوید.',
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    TextFormField(
                      controller: _email,
                      textDirection: TextDirection.ltr,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(
                        labelText: 'ایمیل',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: (value) => value != null && value.contains('@')
                          ? null
                          : 'یک ایمیل معتبر وارد کنید.',
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _password,
                      textDirection: TextDirection.ltr,
                      obscureText: _obscure,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'رمز عبور',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          tooltip: _obscure ? 'نمایش رمز' : 'پنهان کردن رمز',
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
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: TextButton(
                        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'بازیابی رمز پس از افزوده‌شدن پشتیبانی سرور فعال می‌شود.',
                            ),
                          ),
                        ),
                        child: const Text('رمز عبور را فراموش کرده‌اید؟'),
                      ),
                    ),
                    if (state.hasError) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: DarmaltonColors.danger.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(
                            DarmaltonRadius.small,
                          ),
                        ),
                        child: Text(
                          '${state.error}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: DarmaltonColors.danger),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    GradientButton(
                      label: state.isLoading ? 'در حال ورود...' : 'ورود',
                      icon: Icons.login_rounded,
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
                      label: 'ادامه با گوگل',
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
                    OutlinedButton(
                      onPressed: state.isLoading
                          ? null
                          : () => context.push(
                              authenticationLocation(
                                'register',
                                safeReturnLocation(widget.returnTo),
                              ),
                            ),
                      child: const Text('ایجاد حساب کاربری'),
                    ),
                    TextButton(
                      onPressed: state.isLoading
                          ? null
                          : () => context.go('/catalogue'),
                      child: const Text('ادامه بدون ورود'),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'با ورود، استفاده از معلومات شخصی صرفاً برای انجام سفارش پذیرفته می‌شود.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: DarmaltonColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
