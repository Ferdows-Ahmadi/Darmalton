import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AsyncMessage extends StatelessWidget {
  const AsyncMessage({
    required this.message,
    required this.onRetry,
    super.key,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined, size: 48),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      );
}

class EmptyMessage extends StatelessWidget {
  const EmptyMessage(this.title, this.message, {super.key});
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.medication_outlined, size: 48),
              const SizedBox(height: 12),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(message, textAlign: TextAlign.center),
            ],
          ),
        ),
      );
}

class MainScaffold extends StatelessWidget {
  const MainScaffold({required this.child, required this.index, super.key});
  final Widget child;
  final int index;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (value) {
            const routes = ['/catalogue', '/cart', '/orders', '/profile'];
            context.go(routes[value]);
          },
          destinations: const [
            NavigationDestination(icon: Icon(Icons.medication_outlined), label: 'Medicines'),
            NavigationDestination(icon: Icon(Icons.shopping_bag_outlined), label: 'Cart'),
            NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Orders'),
            NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
          ],
        ),
      );
}
