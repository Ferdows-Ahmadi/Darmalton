import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    return MainScaffold(
      index: 2,
      child: Scaffold(
        appBar: AppBar(title: const Text('Order history')),
        body: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(
            message: '$error',
            onRetry: () => ref.invalidate(ordersProvider),
          ),
          data: (items) => items.isEmpty
              ? const EmptyMessage(
                  'No orders yet',
                  'Your completed checkouts will appear here.',
                )
              : RefreshIndicator(
                  onRefresh: () async => ref.invalidate(ordersProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, index) {
                      final order = items[index];
                      return Card(
                        child: ListTile(
                          onTap: () => context.push('/orders/${order.id}'),
                          title: Text(
                            readableStatus(order.status),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            '${order.orderNumber}\n${order.placedAt.toLocal()}',
                          ),
                          trailing: Text('${order.grandTotal} AFN'),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                ),
        ),
      ),
    );
  }
}
