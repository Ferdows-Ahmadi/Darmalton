import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/feature_flags.dart';
import '../../core/models.dart';
import '../../core/phone_number.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';
import '../addresses/address_selector.dart';

String? resolveCheckoutAddressId({
  required List<Address> addresses,
  required String? currentId,
  required String? persistedId,
  required bool selectionInitialized,
  required bool persistedSelectionLoaded,
}) {
  if (addresses.isEmpty) return null;
  final currentIsValid = addresses.any((item) => item.id == currentId);
  if (selectionInitialized && currentIsValid) return currentId;
  if (!persistedSelectionLoaded) return currentIsValid ? currentId : null;
  final persistedIsValid = addresses.any((item) => item.id == persistedId);
  if (persistedIsValid) return persistedId;
  return addresses.where((item) => item.isDefault).firstOrNull?.id ??
      addresses.first.id;
}

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String? _selected;
  bool _selectionInitialized = false;
  bool _busy = false;

  Future<void> _confirmAndPlaceOrder() async {
    if (_selected == null || _busy) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ثبت سفارش'),
        content: const Text(
          'آدرس و پرداخت هنگام تحویل تأیید است؟ قیمت و موجودی نهایی توسط سرور بررسی می‌شود.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('بازگشت'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('تأیید و ثبت'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await _placeOrder();
  }

  Future<void> _placeOrder() async {
    setState(() => _busy = true);
    try {
      final response = await ref
          .read(apiClientProvider)
          .post<Map<String, dynamic>>(
            '/orders/',
            data: {'address_id': _selected},
          );
      ref.invalidate(ordersProvider);
      ref.invalidate(cartProvider);
      final order = Order.fromJson(response.data!);
      if (mounted) context.go('/orders/${order.id}');
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = ref.watch(addressesProvider);
    final persistedSelection = ref.watch(selectedAddressIdProvider);
    final persistedSelected = persistedSelection.value;
    final cart = ref.watch(cartProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('پرداخت')),
      body: addresses.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => AsyncMessage(
          message: '$error',
          onRetry: () => ref.invalidate(addressesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            _selected = null;
            _selectionInitialized = false;
          } else {
            final resolved = resolveCheckoutAddressId(
              addresses: items,
              currentId: _selected,
              persistedId: persistedSelected,
              selectionInitialized: _selectionInitialized,
              persistedSelectionLoaded: persistedSelection.hasValue,
            );
            if (resolved != null) {
              _selected = resolved;
              _selectionInitialized = true;
            }
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            children: [
              _SectionCard(
                icon: Icons.location_on_outlined,
                title: 'آدرس تحویل',
                action: TextButton.icon(
                  onPressed: () async {
                    final selected = await showAddressSelector(context, ref);
                    if (mounted && selected != null) {
                      setState(() {
                        _selected = selected;
                        _selectionInitialized = true;
                      });
                    }
                  },
                  icon: const Icon(Icons.edit_location_alt_outlined, size: 18),
                  label: Text(items.isEmpty ? 'افزودن آدرس' : 'مدیریت آدرس‌ها'),
                ),
                child: items.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text(
                          'برای ادامه، یک آدرس معتبر تحویل اضافه کنید.',
                        ),
                      )
                    : RadioGroup<String>(
                        groupValue: _selected,
                        onChanged: (value) async {
                          if (value == null) return;
                          final address = items.firstWhere(
                            (item) => item.id == value,
                          );
                          setState(() => _selected = value);
                          try {
                            await selectDeliveryAddress(ref, address);
                          } catch (error) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(
                                context,
                              ).showSnackBar(SnackBar(content: Text('$error')));
                            }
                          }
                        },
                        child: Column(
                          children: items
                              .map(
                                (address) => _AddressChoice(
                                  address: address,
                                  selected: address.id == _selected,
                                ),
                              )
                              .toList(),
                        ),
                      ),
              ),
              const SizedBox(height: 14),
              const _SectionCard(
                icon: Icons.local_shipping_outlined,
                title: 'روش تحویل',
                child: _DeliveryMethod(),
              ),
              const SizedBox(height: 14),
              const _SectionCard(
                icon: Icons.account_balance_wallet_outlined,
                title: 'روش پرداخت',
                child: _PaymentMethods(),
              ),
              const SizedBox(height: 14),
              cart.when(
                loading: () => const SkeletonBox(height: 180),
                error: (error, _) => AsyncMessage(
                  message: '$error',
                  onRetry: ref.read(cartProvider.notifier).refresh,
                ),
                data: (value) => _CheckoutSummary(cart: value),
              ),
              const SizedBox(height: 16),
              GradientButton(
                label: 'ثبت سفارش',
                icon: Icons.shopping_bag_outlined,
                onPressed:
                    _selected != null &&
                        !_busy &&
                        cart.value?.items.isNotEmpty == true
                    ? _confirmAndPlaceOrder
                    : null,
                loading: _busy,
              ),
              const SizedBox(height: 12),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.verified_user_outlined,
                    size: 20,
                    color: DarmaltonColors.teal,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'اطلاعات شما محفوظ است و مبلغ را هنگام تحویل می‌پردازید.',
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
    this.action,
  });

  final IconData icon;
  final String title;
  final Widget? action;
  final Widget child;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(icon, color: DarmaltonColors.teal),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                ],
              ),
            ),
            ?action,
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );
}

class _AddressChoice extends StatelessWidget {
  const _AddressChoice({required this.address, required this.selected});

  final Address address;
  final bool selected;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    decoration: BoxDecoration(
      color: selected ? DarmaltonColors.mint : Colors.white,
      borderRadius: BorderRadius.circular(DarmaltonRadius.small),
      border: Border.all(
        color: selected ? DarmaltonColors.teal : DarmaltonColors.line,
      ),
    ),
    child: RadioListTile<String>(
      value: address.id,
      title: Text(
        address.label.isEmpty ? 'آدرس تحویل' : address.label,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${address.recipientName}\n${address.city}، ${address.streetAddress}',
          ),
          LtrText(formatAfghanPhone(address.recipientPhone)),
        ],
      ),
      isThreeLine: true,
    ),
  );
}

class _DeliveryMethod extends StatelessWidget {
  const _DeliveryMethod();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: DarmaltonColors.mint,
      borderRadius: BorderRadius.circular(DarmaltonRadius.small),
      border: Border.all(color: DarmaltonColors.teal),
    ),
    child: const Row(
      children: [
        CircleAvatar(
          backgroundColor: Colors.white,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(Icons.local_shipping_outlined),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'تحویل استاندارد',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              Text('زمان تحویل پس از تأیید داروخانه مشخص می‌شود.'),
            ],
          ),
        ),
        Icon(Icons.check_circle, color: DarmaltonColors.teal),
      ],
    ),
  );
}

class _PaymentMethods extends StatelessWidget {
  const _PaymentMethods();

  @override
  Widget build(BuildContext context) => Column(
    children: [
      const _PaymentChoice(
        icon: Icons.payments_outlined,
        title: 'هنگام تحویل',
        subtitle: 'پرداخت نقدی در زمان دریافت سفارش',
        selected: true,
      ),
      if (FeatureFlags.cardPayments) ...[
        const SizedBox(height: 8),
        const _PaymentChoice(
          icon: Icons.credit_card_outlined,
          title: 'کارت بانکی',
          subtitle: 'پرداخت آنلاین',
          selected: false,
        ),
      ],
      if (FeatureFlags.wallet) ...[
        const SizedBox(height: 8),
        const _PaymentChoice(
          icon: Icons.account_balance_wallet_outlined,
          title: 'کیف پول',
          subtitle: 'پرداخت از موجودی کیف پول',
          selected: false,
        ),
      ],
    ],
  );
}

class _PaymentChoice extends StatelessWidget {
  const _PaymentChoice({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;

  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minHeight: 96),
    padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(
      color: selected ? DarmaltonColors.mint : const Color(0xFFF7F8F9),
      borderRadius: BorderRadius.circular(DarmaltonRadius.small),
      border: Border.all(
        color: selected ? DarmaltonColors.teal : DarmaltonColors.line,
      ),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          color: selected ? DarmaltonColors.teal : DarmaltonColors.muted,
          size: 30,
        ),
        const SizedBox(height: 8),
        Text(
          title,
          maxLines: 2,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: selected ? DarmaltonColors.ink : DarmaltonColors.muted,
          ),
        ),
        Text(
          subtitle,
          style: TextStyle(
            color: selected ? DarmaltonColors.teal : DarmaltonColors.muted,
            fontSize: 11,
          ),
        ),
      ],
    ),
  );
}

class _CheckoutSummary extends StatelessWidget {
  const _CheckoutSummary({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context) => _SectionCard(
    icon: Icons.receipt_long_outlined,
    title: 'خلاصه سفارش',
    child: Column(
      children: [
        _CheckoutLine(
          label: 'قیمت محصولات (${cart.items.length} قلم)',
          value: '${cart.subtotal} ${DariStrings.afn}',
        ),
        const _CheckoutLine(
          label: 'هزینه ارسال',
          value: 'توسط سرور محاسبه می‌شود',
        ),
        const _CheckoutLine(label: 'تخفیف', value: '۰ افغانی'),
        const Divider(height: 26),
        _CheckoutLine(
          label: 'مجموع فعلی',
          value: '${cart.subtotal} ${DariStrings.afn}',
          strong: true,
        ),
        const SizedBox(height: 8),
        const Text(
          'مبلغ قطعی در پاسخ ثبت سفارش برگردانده می‌شود.',
          style: TextStyle(fontSize: 12, color: DarmaltonColors.muted),
        ),
      ],
    ),
  );
}

class _CheckoutLine extends StatelessWidget {
  const _CheckoutLine({
    required this.label,
    required this.value,
    this.strong = false,
  });

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontWeight: strong ? FontWeight.w700 : null),
          ),
        ),
        Text(
          value,
          textAlign: TextAlign.end,
          style: TextStyle(
            color: strong ? DarmaltonColors.teal : DarmaltonColors.muted,
            fontSize: strong ? 18 : 13,
            fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}
