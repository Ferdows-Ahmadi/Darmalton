import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/widgets.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    return MainScaffold(
      index: 1,
      child: Scaffold(
        appBar: AppBar(title: const Text('Your cart')),
        body: cart.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(message: '$error', onRetry: ref.read(cartProvider.notifier).refresh),
          data: (value) => value.items.isEmpty
              ? const EmptyMessage('Your cart is empty', 'Add an available medicine to continue.')
              : Column(
                  children: [
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: value.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, index) {
                          final item = value.items[index];
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  const Icon(Icons.medication_outlined, size: 36),
                                  const SizedBox(width: 12),
                                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(item.medicine.brandName, style: const TextStyle(fontWeight: FontWeight.bold)), Text('${item.medicine.strength} · ${item.lineTotal ?? 'Unavailable'} AFN')])),
                                  IconButton(onPressed: item.quantity <= 1 ? null : () => ref.read(cartProvider.notifier).update(item, item.quantity - 1), icon: const Icon(Icons.remove)),
                                  Text('${item.quantity}'),
                                  IconButton(onPressed: item.quantity >= item.availableQuantity ? null : () => ref.read(cartProvider.notifier).update(item, item.quantity + 1), icon: const Icon(Icons.add)),
                                  IconButton(onPressed: () => ref.read(cartProvider.notifier).remove(item.id), icon: const Icon(Icons.delete_outline)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Subtotal: ${value.subtotal} AFN', style: Theme.of(context).textTheme.titleLarge),
                            const Text('Final prices and stock are verified at checkout.'),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: () => context.push('/checkout'), child: const Text('Continue to checkout')),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
