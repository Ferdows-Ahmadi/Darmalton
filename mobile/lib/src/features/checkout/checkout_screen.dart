import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}
class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String? _selected;
  bool _busy = false;

  Future<void> _placeOrder() async {
    if (_selected == null) return;
    setState(() => _busy = true);
    try {
      final response = await ref.read(apiClientProvider).post<Map<String, dynamic>>('/orders/', data: {'address_id': _selected});
      ref.invalidate(ordersProvider);
      ref.invalidate(cartProvider);
      final order = Order.fromJson(response.data!);
      if (mounted) context.go('/orders/${order.id}');
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$error')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: addresses.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => AsyncMessage(message: '$error', onRetry: () => ref.invalidate(addressesProvider)),
        data: (items) {
          if (_selected == null && items.isNotEmpty) {
            _selected = items.where((item) => item.isDefault).firstOrNull?.id ?? items.first.id;
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('Delivery address', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              ...items.map((address) => Card(
                    child: RadioListTile<String>(
                      value: address.id,
                      groupValue: _selected,
                      onChanged: (value) => setState(() => _selected = value),
                      title: Text(address.label.isEmpty ? 'Delivery address' : address.label),
                      subtitle: Text('${address.recipientName} · ${address.streetAddress}, ${address.city}'),
                    ),
                  )),
              const SizedBox(height: 12),
              OutlinedButton.icon(onPressed: () => _showAddressForm(context), icon: const Icon(Icons.add_location_alt_outlined), label: const Text('Add an address')),
              const SizedBox(height: 24),
              const Card(child: ListTile(leading: Icon(Icons.payments_outlined), title: Text('Cash on delivery'), subtitle: Text('Payment status starts as unpaid.'))),
              const SizedBox(height: 18),
              FilledButton(onPressed: _selected == null || _busy ? null : _placeOrder, child: Text(_busy ? 'Placing order…' : 'Place order')),
            ],
          );
        },
      ),
    );
  }

  Future<void> _showAddressForm(BuildContext context) async {
    final formKey = GlobalKey<FormState>();
    final values = <String, String>{};
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('New address'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: ['recipient_name', 'recipient_phone', 'province', 'city', 'street_address']
                  .map((field) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: TextFormField(
                          decoration: InputDecoration(labelText: field.replaceAll('_', ' ')),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Required.' : null,
                          onSaved: (value) => values[field] = value!.trim(),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              formKey.currentState!.save();
              final response = await ref.read(apiClientProvider).post<Map<String, dynamic>>('/addresses/', data: {...values, 'label': 'Home', 'country_code': 'AF', 'is_default': true});
              final address = Address.fromJson(response.data!);
              ref.invalidate(addressesProvider);
              if (mounted) setState(() => _selected = address.id);
              if (dialogContext.mounted) Navigator.pop(dialogContext);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
