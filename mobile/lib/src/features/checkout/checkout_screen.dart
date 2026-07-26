import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String? _selected;
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
          if (_selected == null && items.isNotEmpty) {
            _selected =
                items.where((item) => item.isDefault).firstOrNull?.id ??
                items.first.id;
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
            children: [
              _SectionCard(
                icon: Icons.location_on_outlined,
                title: 'آدرس تحویل',
                action: TextButton.icon(
                  onPressed: () => _showAddressForm(context),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text(items.isEmpty ? 'افزودن آدرس' : 'آدرس جدید'),
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
                        onChanged: (value) => setState(() => _selected = value),
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
              const _SectionCard(
                icon: Icons.edit_note_outlined,
                title: 'یادداشت سفارش',
                subtitle: 'در این نسخه پشتیبانی نمی‌شود',
                child: TextField(
                  enabled: false,
                  minLines: 2,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'یادداشت سفارش پس از اضافه‌شدن پشتیبانی سرور...',
                  ),
                ),
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

  Future<void> _showAddressForm(BuildContext context) async {
    final formKey = GlobalKey<FormState>();
    final values = <String, String>{};
    String? submitError;
    var saving = false;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('آدرس جدید'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ...const [
                    ('recipient_name', 'نام گیرنده', Icons.person_outline),
                    ('recipient_phone', 'شماره تماس', Icons.phone_outlined),
                    ('province', 'ولایت', Icons.map_outlined),
                    ('city', 'شهر', Icons.location_city_outlined),
                    ('street_address', 'آدرس دقیق', Icons.home_outlined),
                  ].map(
                    (field) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: TextFormField(
                        enabled: !saving,
                        textDirection: field.$1 == 'recipient_phone'
                            ? TextDirection.ltr
                            : TextDirection.rtl,
                        decoration: InputDecoration(
                          labelText: field.$2,
                          prefixIcon: Icon(field.$3),
                        ),
                        validator: (value) =>
                            value == null || value.trim().isEmpty
                            ? 'این بخش الزامی است.'
                            : null,
                        onSaved: (value) => values[field.$1] = value!.trim(),
                      ),
                    ),
                  ),
                  if (submitError != null)
                    Text(
                      submitError!,
                      style: const TextStyle(color: DarmaltonColors.danger),
                    ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: saving ? null : () => Navigator.pop(dialogContext),
              child: const Text('انصراف'),
            ),
            FilledButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      formKey.currentState!.save();
                      setDialogState(() {
                        saving = true;
                        submitError = null;
                      });
                      try {
                        final response = await ref
                            .read(apiClientProvider)
                            .post<Map<String, dynamic>>(
                              '/addresses/',
                              data: {
                                ...values,
                                'label': 'خانه',
                                'country_code': 'AF',
                                'is_default': true,
                              },
                            );
                        final address = Address.fromJson(response.data!);
                        ref.invalidate(addressesProvider);
                        if (mounted) {
                          setState(() => _selected = address.id);
                        }
                        if (dialogContext.mounted) {
                          Navigator.pop(dialogContext);
                        }
                      } catch (error) {
                        setDialogState(() {
                          saving = false;
                          submitError = '$error';
                        });
                      }
                    },
              child: Text(saving ? 'در حال ذخیره...' : 'ذخیره'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.icon,
    required this.title,
    required this.child,
    this.subtitle,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
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
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
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
      subtitle: Text(
        '${address.recipientName}\n${address.city}، ${address.streetAddress}\n${address.recipientPhone}',
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
  Widget build(BuildContext context) => Row(
    children: [
      const Expanded(
        child: _PaymentChoice(
          icon: Icons.payments_outlined,
          title: 'هنگام تحویل',
          subtitle: 'فعال',
          selected: true,
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: _PaymentChoice(
          icon: Icons.credit_card_outlined,
          title: 'کارت بانکی',
          subtitle: DariStrings.comingSoon,
          selected: false,
        ),
      ),
      const SizedBox(width: 8),
      Expanded(
        child: _PaymentChoice(
          icon: Icons.account_balance_wallet_outlined,
          title: 'کیف پول',
          subtitle: DariStrings.comingSoon,
          selected: false,
        ),
      ),
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
    height: 126,
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
