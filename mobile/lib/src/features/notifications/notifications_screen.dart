import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _open(
    BuildContext context,
    WidgetRef ref,
    AppNotification item,
  ) async {
    if (!item.isRead) {
      await ref.read(notificationActionsProvider).markRead(item.id);
    }
    if (context.mounted) context.push(item.destination);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return MainScaffold(
      index: 2,
      fallbackPath: '/catalogue',
      child: Scaffold(
        appBar: AppBar(
          title: const Text('اعلان‌ها'),
          actions: [
            TextButton(
              onPressed:
                  notifications.value?.any((item) => !item.isRead) == true
                  ? () => ref.read(notificationActionsProvider).markAllRead()
                  : null,
              child: const Text('همه خوانده شد'),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async => ref.invalidate(notificationsProvider),
          child: notifications.when(
            loading: () => ListView(
              padding: EdgeInsets.all(16),
              children: [
                SkeletonBox(height: 112),
                SizedBox(height: 12),
                SkeletonBox(height: 112),
              ],
            ),
            error: (error, _) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                AsyncMessage(
                  message: '$error',
                  onRetry: () => ref.invalidate(notificationsProvider),
                ),
              ],
            ),
            data: (items) => items.isEmpty
                ? ListView(
                    padding: EdgeInsets.all(16),
                    children: [
                      SizedBox(height: 80),
                      EmptyMessage(
                        'اعلان تازه‌ای ندارید',
                        'تغییر وضعیت نسخه و سفارش شما در این‌جا نمایش داده می‌شود.',
                        icon: Icons.notifications_none_rounded,
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, index) {
                      final item = items[index];
                      return DarmaltonCard(
                        onTap: () => _open(context, ref, item),
                        color: item.isRead
                            ? Colors.white
                            : DarmaltonColors.mint,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              backgroundColor: item.isRead
                                  ? DarmaltonColors.canvas
                                  : Colors.white,
                              foregroundColor: DarmaltonColors.teal,
                              child: Icon(
                                item.orderId != null
                                    ? Icons.local_shipping_outlined
                                    : Icons.assignment_outlined,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.displayTitle,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(item.displayMessage),
                                  const SizedBox(height: 6),
                                  LtrText(
                                    _dateTime(item.createdAt),
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            if (!item.isRead)
                              const Padding(
                                padding: EdgeInsets.only(top: 8),
                                child: CircleAvatar(
                                  radius: 5,
                                  backgroundColor: DarmaltonColors.teal,
                                ),
                              ),
                          ],
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

String _dateTime(DateTime value) {
  final local = value.toLocal();
  return '${local.year.toString().padLeft(4, '0')}/'
      '${local.month.toString().padLeft(2, '0')}/'
      '${local.day.toString().padLeft(2, '0')} '
      '${local.hour.toString().padLeft(2, '0')}:'
      '${local.minute.toString().padLeft(2, '0')}';
}
