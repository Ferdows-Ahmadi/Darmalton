import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/widgets.dart';

class MedicineDetailScreen extends ConsumerWidget {
  const MedicineDetailScreen({required this.id, super.key});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medicine = ref.watch(medicineProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Medicine details')),
      body: medicine.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => AsyncMessage(
          message: '$error',
          onRetry: () => ref.invalidate(medicineProvider(id)),
        ),
        data: (item) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xffd9eee8),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: item.imageUrl.isEmpty
                    ? const Icon(Icons.medication, size: 100)
                    : Image.network(
                        item.imageUrl,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) =>
                            const Icon(Icons.medication, size: 100),
                      ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              item.brandName,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(
              '${item.genericName} · ${item.strength}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 18),
            Text(item.description),
            const SizedBox(height: 18),
            _Fact('Manufacturer', item.manufacturer),
            _Fact('Dosage form', item.dosageForm),
            _Fact(
              'Prescription',
              item.prescriptionRequired ? 'Required' : 'Not required',
            ),
            _Fact('Stock', '${item.availableQuantity} available'),
            const SizedBox(height: 20),
            Text(
              item.price == null ? 'Unavailable' : '${item.price} AFN',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: !item.inStock
                  ? null
                  : () async {
                      try {
                        await ref.read(cartProvider.notifier).add(item.id);
                        if (context.mounted) {
                          context.go('/cart');
                        }
                      } catch (error) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(
                            context,
                          ).showSnackBar(SnackBar(content: Text('$error')));
                        }
                      }
                    },
              icon: const Icon(Icons.add_shopping_cart),
              label: Text(item.inStock ? 'Add to cart' : 'Out of stock'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    title: Text(label),
    trailing: Flexible(
      child: Text(
        value,
        textAlign: TextAlign.right,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
    ),
  );
}
