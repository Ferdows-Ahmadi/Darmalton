import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({required this.id, super.key});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderProvider(id));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order details'),
        actions: [
          IconButton(
            onPressed: () => ref.invalidate(orderProvider(id)),
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh status',
          ),
        ],
      ),
      body: order.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => AsyncMessage(
          message: '$error',
          onRetry: () => ref.invalidate(orderProvider(id)),
        ),
        data: (value) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              readableStatus(value.status),
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(value.orderNumber),
            const SizedBox(height: 22),
            Text('Items', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            ...value.items.map(
              (item) => Card(
                child: ListTile(
                  title: Text(item.medicineName),
                  subtitle: Text(
                    '${item.strength} · ${item.dosageForm}\n'
                    '${item.quantity} × ${item.unitPrice} ${value.currencyCode}',
                  ),
                  trailing: Text(
                    '${item.lineTotal} ${value.currencyCode}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  isThreeLine: true,
                ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              'Delivery address',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(_deliveryAddress(value.deliveryAddress)),
            const SizedBox(height: 22),
            Text(
              'Status history',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            ...value.statusHistory.map(
              (history) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(
                  Icons.check_circle,
                  color: Color(0xff0e6f66),
                ),
                title: Text(readableStatus(history.toStatus)),
                subtitle: Text(
                  '${history.createdAt.toLocal()}${history.note.isEmpty ? '' : '\n${history.note}'}',
                ),
              ),
            ),
            const Divider(height: 32),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                'Cash on delivery · ${readableStatus(value.paymentStatus)}',
              ),
              trailing: Text(
                '${value.grandTotal} ${value.currencyCode}',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _deliveryAddress(Map<String, String> address) {
    final recipient = address['recipient_name'] ?? '';
    final street = address['street_address'] ?? '';
    final city = address['city'] ?? '';
    final province = address['province'] ?? '';
    return [
      recipient,
      [street, city, province].where((value) => value.isNotEmpty).join(', '),
    ].where((value) => value.isNotEmpty).join('\n');
  }
}
