import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    return MainScaffold(
      index: 3,
      child: Scaffold(
        appBar: AppBar(title: const Text(DariStrings.cart)),
        body: cart.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(
            message: '$error',
            onRetry: ref.read(cartProvider.notifier).refresh,
          ),
          data: (value) => value.items.isEmpty
              ? EmptyMessage(
                  'سبد خرید شما خالی است',
                  'محصول مورد نیازتان را پیدا کنید و به سبد بیفزایید.',
                  icon: Icons.shopping_cart_outlined,
                  actionLabel: 'مشاهده محصولات',
                  onAction: () => context.go('/catalogue'),
                )
              : _FilledCart(cart: value),
        ),
      ),
    );
  }
}

class _FilledCart extends ConsumerWidget {
  const _FilledCart({required this.cart});

  final Cart cart;

  Future<void> _confirmRemove(
    BuildContext context,
    WidgetRef ref,
    CartItem item,
  ) async {
    final remove = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف از سبد خرید؟'),
        content: Text('${item.medicine.displayName} از سبد حذف شود؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('خیر'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
    if (remove == true) {
      await ref.read(cartProvider.notifier).remove(item.id);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) => ListView(
    padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
    children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, color: DarmaltonColors.teal),
          const SizedBox(width: 8),
          Text('${cart.items.length} قلم محصول در سبد شما'),
        ],
      ),
      const SizedBox(height: 16),
      ...cart.items.map(
        (item) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _CartItemCard(
            item: item,
            onDecrease: item.quantity <= 1
                ? null
                : () => ref
                      .read(cartProvider.notifier)
                      .updateQuantity(item, item.quantity - 1),
            onIncrease: item.quantity >= item.availableQuantity
                ? null
                : () => ref
                      .read(cartProvider.notifier)
                      .updateQuantity(item, item.quantity + 1),
            onRemove: () => _confirmRemove(context, ref, item),
          ),
        ),
      ),
      const SizedBox(height: 2),
      const TextField(
        enabled: false,
        decoration: InputDecoration(
          labelText: 'کد تخفیف',
          hintText: 'کوپن در این نسخه پشتیبانی نمی‌شود',
          prefixIcon: Icon(Icons.local_offer_outlined),
          suffixIcon: Padding(
            padding: EdgeInsets.all(12),
            child: Text(DariStrings.comingSoon),
          ),
        ),
      ),
      const SizedBox(height: 16),
      _OrderSummary(cart: cart),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: DarmaltonColors.mint,
          borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        ),
        child: const Row(
          children: [
            Icon(Icons.local_shipping_outlined, color: DarmaltonColors.teal),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'زمان تحویل پس از تأیید سفارش مشخص می‌شود',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    'موجودی و قیمت نهایی در مرحله پرداخت دوباره بررسی می‌شود.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      GradientButton(
        label: 'ادامه به پرداخت',
        icon: Icons.lock_outline_rounded,
        onPressed: () => context.push('/checkout'),
      ),
    ],
  );
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.onDecrease,
    required this.onIncrease,
    required this.onRemove,
  });

  final CartItem item;
  final VoidCallback? onDecrease;
  final VoidCallback? onIncrease;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: const EdgeInsets.all(12),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 96,
          height: 120,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(DarmaltonRadius.small),
            child: MedicineImage(
              medicine: item.medicine,
              padding: const EdgeInsets.all(8),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.medicine.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 2),
              LtrText(
                '${item.medicine.genericName} · ${item.medicine.strength}',
                maxLines: 1,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Text(
                item.lineTotal == null
                    ? DariStrings.unavailable
                    : '${item.lineTotal} ${DariStrings.afn}',
                style: const TextStyle(
                  color: DarmaltonColors.teal,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _SmallQuantityButton(
                    icon: Icons.add_rounded,
                    onPressed: onIncrease,
                  ),
                  SizedBox(
                    width: 38,
                    child: Text(
                      '${item.quantity}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  _SmallQuantityButton(
                    icon: Icons.remove_rounded,
                    onPressed: onDecrease,
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'حذف',
                    onPressed: onRemove,
                    color: DarmaltonColors.danger,
                    icon: const Icon(Icons.delete_outline_rounded),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _SmallQuantityButton extends StatelessWidget {
  const _SmallQuantityButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => IconButton.outlined(
    visualDensity: VisualDensity.compact,
    constraints: const BoxConstraints.tightFor(width: 36, height: 36),
    onPressed: onPressed,
    icon: Icon(icon, size: 18),
  );
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Icon(
              Icons.receipt_long_outlined,
              color: DarmaltonColors.teal,
            ),
            const SizedBox(width: 8),
            Text('خلاصه سفارش', style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
        const SizedBox(height: 14),
        _SummaryLine(
          label: 'جمع محصولات',
          value: '${cart.subtotal} ${DariStrings.afn}',
        ),
        const _SummaryLine(label: 'هزینه ارسال', value: 'در مرحله پرداخت'),
        const _SummaryLine(label: 'تخفیف', value: '۰ افغانی'),
        const Divider(height: 28),
        _SummaryLine(
          label: 'مبلغ فعلی',
          value: '${cart.subtotal} ${DariStrings.afn}',
          strong: true,
        ),
      ],
    ),
  );
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
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
          style: TextStyle(
            color: strong ? DarmaltonColors.teal : DarmaltonColors.muted,
            fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
            fontSize: strong ? 18 : 14,
          ),
        ),
      ],
    ),
  );
}
