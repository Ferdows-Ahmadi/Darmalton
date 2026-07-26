import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderProvider(id));
    return MainScaffold(
      index: 1,
      child: Scaffold(
        appBar: AppBar(title: const Text('پیگیری سفارش')),
        body: order.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(
            message: '$error',
            onRetry: () => ref.invalidate(orderProvider(id)),
          ),
          data: (item) => RefreshIndicator(
            onRefresh: () async => ref.invalidate(orderProvider(id)),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
              children: [
                _OrderSummary(order: item),
                const SizedBox(height: 14),
                const _StaticRouteMap(),
                const SizedBox(height: 14),
                _Timeline(order: item),
                const SizedBox(height: 14),
                const _CourierUnavailable(),
                const SizedBox(height: 14),
                _MoreDetails(order: item),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _SummaryFact(
                label: 'شماره سفارش',
                value: order.orderNumber,
                icon: Icons.receipt_long_outlined,
                ltr: true,
              ),
            ),
            const SizedBox(height: 72, child: VerticalDivider()),
            Expanded(
              child: _SummaryFact(
                label: 'مبلغ کل',
                value: '${order.grandTotal} ${DariStrings.afn}',
                icon: Icons.account_balance_wallet_outlined,
              ),
            ),
          ],
        ),
        const Divider(height: 24),
        Row(
          children: [
            Expanded(
              child: _SummaryFact(
                label: 'وضعیت فعلی',
                value: DariStrings.statusLabel(order.status),
                icon: Icons.local_shipping_outlined,
                accent: true,
              ),
            ),
            const SizedBox(height: 72, child: VerticalDivider()),
            const Expanded(
              child: _SummaryFact(
                label: 'زمان تحویل',
                value: 'پس از تأیید داروخانه',
                icon: Icons.schedule_outlined,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

class _SummaryFact extends StatelessWidget {
  const _SummaryFact({
    required this.label,
    required this.value,
    required this.icon,
    this.ltr = false,
    this.accent = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool ltr;
  final bool accent;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      CircleAvatar(
        backgroundColor: DarmaltonColors.mint,
        foregroundColor: DarmaltonColors.teal,
        child: Icon(icon, size: 22),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            if (ltr)
              LtrText(
                value,
                maxLines: 1,
                style: const TextStyle(fontWeight: FontWeight.w700),
              )
            else
              Text(
                value,
                maxLines: 2,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: accent ? DarmaltonColors.teal : DarmaltonColors.ink,
                ),
              ),
          ],
        ),
      ),
    ],
  );
}

class _StaticRouteMap extends StatelessWidget {
  const _StaticRouteMap();

  @override
  Widget build(BuildContext context) => Container(
    height: 190,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: const Color(0xFFF0F6F5),
      borderRadius: BorderRadius.circular(DarmaltonRadius.large),
      border: Border.all(color: DarmaltonColors.line),
    ),
    child: Stack(
      children: [
        ...List.generate(
          6,
          (index) => Positioned(
            left: index * 80.0 - 30,
            top: 0,
            bottom: 0,
            child: Transform.rotate(
              angle: 0.28,
              child: Container(width: 10, color: Colors.white),
            ),
          ),
        ),
        ...List.generate(
          4,
          (index) => Positioned(
            left: 0,
            right: 0,
            top: index * 55.0 + 14,
            child: Container(height: 8, color: Colors.white),
          ),
        ),
        const Positioned(
          right: 45,
          top: 66,
          child: Icon(
            Icons.local_pharmacy_rounded,
            size: 48,
            color: DarmaltonColors.teal,
          ),
        ),
        Positioned(
          right: 90,
          left: 100,
          top: 92,
          child: const SizedBox(
            height: 34,
            child: CustomPaint(painter: _DottedRoutePainter()),
          ),
        ),
        const Positioned(
          left: 42,
          bottom: 48,
          child: CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white,
            foregroundColor: DarmaltonColors.teal,
            child: Icon(Icons.home_rounded, size: 32),
          ),
        ),
        Positioned(
          right: 12,
          bottom: 10,
          left: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(99),
            ),
            child: const Text(
              'نمایش مسیر نمونه است؛ GPS زنده فعال نیست.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: DarmaltonColors.muted),
            ),
          ),
        ),
      ],
    ),
  );
}

class _DottedRoutePainter extends CustomPainter {
  const _DottedRoutePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = DarmaltonColors.teal
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;
    const dash = 11.0;
    const gap = 10.0;
    var x = 0.0;
    while (x < size.width) {
      canvas.drawLine(
        Offset(x, size.height * 0.55),
        Offset((x + dash).clamp(0, size.width), size.height * 0.55),
        paint,
      );
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.order});

  final Order order;

  static const normalFlow = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  @override
  Widget build(BuildContext context) {
    final actual = order.statusHistory.map((item) => item.toStatus).toList();
    final terminal = {'CANCELLED', 'REJECTED'}.contains(order.status);
    final statuses = terminal
        ? actual
        : normalFlow.where((status) {
            final current = normalFlow.indexOf(order.status);
            final index = normalFlow.indexOf(status);
            return index <= current + 2;
          }).toList();

    return DarmaltonCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('روند سفارش', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          ...List.generate(statuses.length, (index) {
            final status = statuses[index];
            final history = order.statusHistory
                .where((entry) => entry.toStatus == status)
                .firstOrNull;
            final isActual = actual.contains(status);
            final isCurrent = status == order.status;
            return _TimelineStep(
              status: status,
              date: history?.createdAt,
              note: history?.note ?? '',
              isActual: isActual,
              isCurrent: isCurrent,
              showLine: index != statuses.length - 1,
            );
          }),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.status,
    required this.date,
    required this.note,
    required this.isActual,
    required this.isCurrent,
    required this.showLine,
  });

  final String status;
  final DateTime? date;
  final String note;
  final bool isActual;
  final bool isCurrent;
  final bool showLine;

  @override
  Widget build(BuildContext context) {
    final color = isCurrent
        ? DarmaltonColors.teal
        : isActual
        ? DarmaltonColors.success
        : const Color(0xFFC5CDD3);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 36,
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isActual || isCurrent ? color : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: color, width: 2),
                    boxShadow: isCurrent
                        ? const [
                            BoxShadow(
                              color: Color(0x33079C9A),
                              blurRadius: 8,
                              spreadRadius: 3,
                            ),
                          ]
                        : null,
                  ),
                  child: Icon(
                    isActual ? Icons.check_rounded : Icons.circle,
                    color: isActual ? Colors.white : color,
                    size: isActual ? 18 : 9,
                  ),
                ),
                if (showLine)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 3),
                      color: color.withValues(alpha: 0.45),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    DariStrings.statusLabel(status),
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: isCurrent ? DarmaltonColors.teal : null,
                    ),
                  ),
                  if (date != null)
                    LtrText(
                      _dateTime(date!),
                      style: Theme.of(context).textTheme.bodySmall,
                    )
                  else
                    const Text(
                      'منتظر به‌روزرسانی',
                      style: TextStyle(
                        fontSize: 12,
                        color: DarmaltonColors.muted,
                      ),
                    ),
                  if (note.isNotEmpty)
                    Text(note, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
          Icon(_statusIcon(status), color: color),
        ],
      ),
    );
  }
}

class _CourierUnavailable extends StatelessWidget {
  const _CourierUnavailable();

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Row(
      children: [
        const CircleAvatar(
          radius: 30,
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(Icons.delivery_dining_outlined, size: 32),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'پیک اختصاص نیافته',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              Text('اطلاعات پیک و تماس در این نسخه پشتیبانی نمی‌شود.'),
            ],
          ),
        ),
        IconButton(
          tooltip: DariStrings.comingSoon,
          onPressed: null,
          icon: const Icon(Icons.phone_outlined),
        ),
        IconButton(
          tooltip: DariStrings.comingSoon,
          onPressed: null,
          icon: const Icon(Icons.chat_bubble_outline_rounded),
        ),
      ],
    ),
  );
}

class _MoreDetails extends StatelessWidget {
  const _MoreDetails({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: ExpansionTile(
      tilePadding: EdgeInsets.zero,
      childrenPadding: const EdgeInsets.only(bottom: 8),
      leading: const Icon(
        Icons.info_outline_rounded,
        color: DarmaltonColors.teal,
      ),
      title: const Text(
        'جزئیات بیشتر',
        style: TextStyle(fontWeight: FontWeight.w700),
      ),
      children: [
        ...order.items.map(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.medication_outlined),
            title: Text(item.medicineName),
            subtitle: LtrText('${item.strength} · ${item.dosageForm}'),
            trailing: Text(
              '${item.quantity} × ${item.unitPrice} ${DariStrings.afn}',
            ),
          ),
        ),
        const Divider(),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.location_on_outlined),
          title: const Text('آدرس تحویل'),
          subtitle: Text(
            '${order.deliveryAddress['city'] ?? ''}، '
            '${order.deliveryAddress['street_address'] ?? ''}',
          ),
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.payments_outlined),
          title: const Text('روش پرداخت'),
          subtitle: const Text('پرداخت هنگام تحویل'),
          trailing: Text(
            order.paymentStatus == 'PAID' ? 'پرداخت‌شده' : 'پرداخت‌نشده',
          ),
        ),
        const Divider(),
        _TotalLine(label: 'جمع محصولات', value: order.subtotal),
        _TotalLine(label: 'هزینه ارسال', value: order.deliveryFee),
        _TotalLine(label: 'تخفیف', value: order.discountTotal),
        _TotalLine(label: 'مبلغ نهایی', value: order.grandTotal, strong: true),
      ],
    ),
  );
}

class _TotalLine extends StatelessWidget {
  const _TotalLine({
    required this.label,
    required this.value,
    this.strong = false,
  });

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontWeight: strong ? FontWeight.w700 : null),
          ),
        ),
        Text(
          '$value ${DariStrings.afn}',
          style: TextStyle(
            color: strong ? DarmaltonColors.teal : null,
            fontWeight: strong ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

IconData _statusIcon(String status) => switch (status) {
  'PENDING' => Icons.receipt_long_outlined,
  'CONFIRMED' => Icons.verified_outlined,
  'PREPARING' => Icons.inventory_2_outlined,
  'READY_FOR_DELIVERY' => Icons.shopping_bag_outlined,
  'OUT_FOR_DELIVERY' => Icons.delivery_dining_outlined,
  'DELIVERED' => Icons.home_outlined,
  'CANCELLED' || 'REJECTED' => Icons.cancel_outlined,
  _ => Icons.circle_outlined,
};

String _dateTime(DateTime value) {
  final date = value.toLocal();
  return '${date.year}/${date.month.toString().padLeft(2, '0')}/'
      '${date.day.toString().padLeft(2, '0')} '
      '${date.hour.toString().padLeft(2, '0')}:'
      '${date.minute.toString().padLeft(2, '0')}';
}
