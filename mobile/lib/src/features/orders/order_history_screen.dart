import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

enum _OrderGroup { active, completed, cancelled }

class OrderHistoryScreen extends ConsumerStatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  ConsumerState<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends ConsumerState<OrderHistoryScreen> {
  _OrderGroup _group = _OrderGroup.active;

  List<Order> _filter(List<Order> orders) => orders.where((order) {
    switch (_group) {
      case _OrderGroup.active:
        return !{'DELIVERED', 'CANCELLED', 'REJECTED'}.contains(order.status);
      case _OrderGroup.completed:
        return order.status == 'DELIVERED';
      case _OrderGroup.cancelled:
        return {'CANCELLED', 'REJECTED'}.contains(order.status);
    }
  }).toList();

  @override
  Widget build(BuildContext context) {
    final orders = ref.watch(ordersProvider);
    return MainScaffold(
      index: 1,
      child: Scaffold(
        appBar: AppBar(title: Text(DariStrings.orders)),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
              child: SegmentedButton<_OrderGroup>(
                expandedInsets: EdgeInsets.zero,
                segments: const [
                  ButtonSegment(
                    value: _OrderGroup.active,
                    label: Text('جاری'),
                    icon: Icon(Icons.local_shipping_outlined),
                  ),
                  ButtonSegment(
                    value: _OrderGroup.completed,
                    label: Text('تکمیل‌شده'),
                    icon: Icon(Icons.check_circle_outline),
                  ),
                  ButtonSegment(
                    value: _OrderGroup.cancelled,
                    label: Text('لغوشده'),
                    icon: Icon(Icons.cancel_outlined),
                  ),
                ],
                selected: {_group},
                onSelectionChanged: (value) =>
                    setState(() => _group = value.first),
              ),
            ),
            Expanded(
              child: orders.when(
                loading: () => ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (_, _) => const SkeletonBox(height: 252),
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemCount: 4,
                ),
                error: (error, _) => AsyncMessage(
                  message: '$error',
                  onRetry: () => ref.invalidate(ordersProvider),
                ),
                data: (items) {
                  final filtered = _filter(items);
                  if (filtered.isEmpty) {
                    return EmptyMessage(
                      _group == _OrderGroup.active
                          ? 'سفارش جاری ندارید'
                          : _group == _OrderGroup.completed
                          ? 'سفارش تکمیل‌شده ندارید'
                          : 'سفارش لغوشده ندارید',
                      'سفارش‌های مرتبط با این وضعیت در اینجا نمایش داده می‌شود.',
                      icon: Icons.receipt_long_outlined,
                      actionLabel: _group == _OrderGroup.active
                          ? 'مشاهده محصولات'
                          : null,
                      onAction: () => context.go('/catalogue'),
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async => ref.invalidate(ordersProvider),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (_, index) =>
                          _OrderCard(order: filtered[index]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final active = !{
      'DELIVERED',
      'CANCELLED',
      'REJECTED',
    }.contains(order.status);
    final color = order.status == 'DELIVERED'
        ? DarmaltonColors.success
        : {'CANCELLED', 'REJECTED'}.contains(order.status)
        ? DarmaltonColors.danger
        : DarmaltonColors.teal;

    return DarmaltonCard(
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    LtrText(
                      order.orderNumber,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 16,
                          color: DarmaltonColors.muted,
                        ),
                        const SizedBox(width: 5),
                        LtrText(
                          _date(order.placedAt),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              StatusChip(
                label: DariStrings.statusLabel(order.status),
                icon: active
                    ? Icons.local_shipping_outlined
                    : order.status == 'DELIVERED'
                    ? Icons.check_circle_outline
                    : Icons.cancel_outlined,
                color: color,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                width: 92,
                height: 78,
                decoration: BoxDecoration(
                  color: DarmaltonColors.mint,
                  borderRadius: BorderRadius.circular(DarmaltonRadius.small),
                ),
                child: const Icon(
                  Icons.medication_outlined,
                  size: 44,
                  color: DarmaltonColors.teal,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${order.items.fold<int>(0, (sum, item) => sum + item.quantity)} محصول',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 5),
                    const Text('مبلغ کل'),
                    Text(
                      '${order.grandTotal} ${DariStrings.afn}',
                      style: const TextStyle(
                        color: DarmaltonColors.teal,
                        fontWeight: FontWeight.w700,
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/orders/${order.id}'),
                  icon: const Icon(Icons.info_outline_rounded),
                  label: const Text('جزئیات'),
                ),
              ),
              if (active) ...[
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => context.push('/orders/${order.id}'),
                    icon: const Icon(Icons.location_on_outlined),
                    label: const Text('پیگیری'),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

String _date(DateTime value) {
  final date = value.toLocal();
  return '${date.year.toString().padLeft(4, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/'
      '${date.day.toString().padLeft(2, '0')}';
}
