import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/widgets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return MainScaffold(
      index: 3,
      child: Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: auth.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(message: '$error', onRetry: () => ref.invalidate(authProvider)),
          data: (user) => user == null
              ? const EmptyMessage('Signed out', 'Sign in again to view your profile.')
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    CircleAvatar(radius: 42, child: Text(user.displayName[0].toUpperCase(), style: const TextStyle(fontSize: 30))),
                    const SizedBox(height: 18),
                    Center(child: Text(user.displayName, style: Theme.of(context).textTheme.headlineSmall)),
                    Center(child: Text(user.email)),
                    const SizedBox(height: 28),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        await ref.read(authProvider.notifier).logout();
                        if (context.mounted) context.go('/login');
                      },
                      icon: const Icon(Icons.logout),
                      label: const Text('Sign out'),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
