import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'design_system.dart';
import 'localized_text.dart';
import 'providers.dart';

String safeReturnLocation(String? value) {
  if (value == null || value.isEmpty || !value.startsWith('/')) {
    return '/catalogue';
  }
  final uri = Uri.tryParse(value);
  if (uri == null ||
      uri.hasScheme ||
      uri.hasAuthority ||
      value.startsWith('//') ||
      uri.path == '/login' ||
      uri.path == '/register' ||
      uri.path == '/splash') {
    return '/catalogue';
  }
  return value;
}

String authenticationLocation(String mode, String destination) {
  final safe = safeReturnLocation(destination);
  return Uri(
    path: mode == 'register' ? '/register' : '/login',
    queryParameters: {'returnTo': safe},
  ).toString();
}

class ProtectedRoute extends ConsumerWidget {
  const ProtectedRoute({
    required this.destination,
    required this.child,
    super.key,
  });

  final String destination;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return auth.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (_, _) => _AuthenticationRequired(destination: destination),
      data: (user) => user == null
          ? _AuthenticationRequired(destination: destination)
          : child,
    );
  }
}

class _AuthenticationRequired extends StatelessWidget {
  const _AuthenticationRequired({required this.destination});

  final String destination;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('ورود به حساب')),
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: DarmaltonColors.mint,
              borderRadius: BorderRadius.circular(DarmaltonRadius.large),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(
                  radius: 34,
                  backgroundColor: Colors.white,
                  foregroundColor: DarmaltonColors.teal,
                  child: Icon(Icons.lock_person_outlined, size: 36),
                ),
                const SizedBox(height: 18),
                Text(
                  'برای ادامه وارد حساب شوید',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'مرور محصولات آزاد است؛ این بخش به معلومات شخصی حساب شما نیاز دارد.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: () =>
                      context.go(authenticationLocation('login', destination)),
                  icon: const Icon(Icons.login_rounded),
                  label: const Text('ورود'),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => context.go(
                    authenticationLocation('register', destination),
                  ),
                  icon: const Icon(Icons.person_add_alt_1_rounded),
                  label: const Text('ایجاد حساب'),
                ),
                TextButton(
                  onPressed: () => context.go('/catalogue'),
                  child: const Text('بازگشت به خانه'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
