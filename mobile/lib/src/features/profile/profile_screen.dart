import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _comingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature در نسخه بعدی فعال می‌شود.')),
    );
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('خروج از حساب'),
        content: const Text('می‌خواهید از حساب کاربری خود خارج شوید؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('خروج'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(authProvider.notifier).logout();
    if (context.mounted) context.go('/catalogue');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final orders = ref.watch(ordersProvider);
    final addresses = ref.watch(addressesProvider);

    return MainScaffold(
      index: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(DariStrings.profile),
          actions: [
            IconButton(
              tooltip: 'تنظیمات',
              onPressed: () => _comingSoon(context, 'تنظیمات پیشرفته'),
              icon: const Icon(Icons.settings_outlined),
            ),
          ],
        ),
        body: auth.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => AsyncMessage(
            message: '$error',
            onRetry: () => ref.invalidate(authProvider),
          ),
          data: (user) => user == null
              ? EmptyMessage(
                  'از حساب خارج شده‌اید',
                  'برای مشاهده حساب کاربری دوباره وارد شوید.',
                  icon: Icons.person_off_outlined,
                  actionLabel: 'ورود',
                  onAction: () => context.go('/login'),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(authProvider);
                    ref.invalidate(ordersProvider);
                    ref.invalidate(addressesProvider);
                  },
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                    children: [
                      _ProfileHeader(
                        user: user,
                        onEdit: () => _comingSoon(context, 'ویرایش پروفایل'),
                      ),
                      const SizedBox(height: 14),
                      _AccountStats(orders: orders),
                      const SizedBox(height: 14),
                      _ProfileRow(
                        icon: Icons.location_on_outlined,
                        label: 'آدرس‌های من',
                        onTap: () => _showAddresses(context, addresses),
                      ),
                      _ProfileRow(
                        icon: Icons.credit_card_outlined,
                        label: 'روش‌های پرداخت',
                        trailing: DariStrings.comingSoon,
                        onTap: () =>
                            _comingSoon(context, 'روش‌های پرداخت ذخیره‌شده'),
                      ),
                      _ProfileRow(
                        icon: Icons.receipt_long_outlined,
                        label: 'نسخه‌های من',
                        trailing: DariStrings.comingSoon,
                        onTap: () => context.push('/prescription'),
                      ),
                      _ProfileRow(
                        icon: Icons.notifications_none_rounded,
                        label: 'اعلان‌ها',
                        trailing: DariStrings.comingSoon,
                        onTap: () => _comingSoon(context, 'اعلان‌ها'),
                      ),
                      _ProfileRow(
                        icon: Icons.support_agent_rounded,
                        label: 'مرکز کمک',
                        onTap: () => showDialog<void>(
                          context: context,
                          builder: (context) => const AlertDialog(
                            title: Text('مرکز کمک'),
                            content: Text(
                              'برای مشکلات سفارش با داروخانه تماس بگیرید. '
                              'سیستم تکت پشتیبانی در نسخه بعدی افزوده می‌شود.',
                            ),
                          ),
                        ),
                      ),
                      _ProfileRow(
                        icon: Icons.info_outline_rounded,
                        label: 'درباره درملتون',
                        onTap: () => showAboutDialog(
                          context: context,
                          applicationName: DariStrings.appName,
                          applicationVersion: '1.0.0',
                          children: const [
                            Text(
                              'نسخه نمایشی فروشگاه آنلاین دوا با قیمت و موجودی کنترل‌شده توسط سرور.',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      _ProfileRow(
                        icon: Icons.logout_rounded,
                        label: 'خروج',
                        danger: true,
                        onTap: () => _logout(context, ref),
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  void _showAddresses(
    BuildContext context,
    AsyncValue<List<Address>> addresses,
  ) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'آدرس‌های من',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              addresses.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Text('$error'),
                data: (items) => items.isEmpty
                    ? const Text(
                        'هنوز آدرسی ندارید. هنگام پرداخت آدرس اضافه کنید.',
                      )
                    : Column(
                        children: items
                            .map(
                              (address) => ListTile(
                                leading: Icon(
                                  address.isDefault
                                      ? Icons.home_rounded
                                      : Icons.location_on_outlined,
                                  color: DarmaltonColors.teal,
                                ),
                                title: Text(
                                  address.label.isEmpty
                                      ? 'آدرس تحویل'
                                      : address.label,
                                ),
                                subtitle: Text(
                                  '${address.city}، ${address.streetAddress}',
                                ),
                                trailing: address.isDefault
                                    ? const Chip(label: Text('پیش‌فرض'))
                                    : null,
                              ),
                            )
                            .toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user, required this.onEdit});

  final User user;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Row(
      children: [
        CircleAvatar(
          radius: 48,
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Text(
            user.displayName.substring(0, 1),
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user.displayName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 2),
              LtrText(
                user.phone?.isNotEmpty == true ? user.phone! : user.email,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 18),
                label: const Text('ویرایش پروفایل'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _AccountStats extends StatelessWidget {
  const _AccountStats({required this.orders});

  final AsyncValue<List<Order>> orders;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Row(
      children: [
        Expanded(
          child: _Stat(
            icon: Icons.shopping_bag_outlined,
            label: 'سفارش‌های من',
            value: orders.when(
              data: (items) => '${items.length}',
              loading: () => '...',
              error: (_, _) => '—',
            ),
            subtitle: 'همه سفارش‌ها',
          ),
        ),
        const SizedBox(height: 76, child: VerticalDivider()),
        const Expanded(
          child: _Stat(
            icon: Icons.account_balance_wallet_outlined,
            label: 'موجودی کیف پول',
            value: '—',
            subtitle: DariStrings.comingSoon,
          ),
        ),
      ],
    ),
  );
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.icon,
    required this.label,
    required this.value,
    required this.subtitle,
  });

  final IconData icon;
  final String label;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      CircleAvatar(
        backgroundColor: DarmaltonColors.mint,
        foregroundColor: DarmaltonColors.teal,
        child: Icon(icon),
      ),
      const SizedBox(width: 10),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(
              color: DarmaltonColors.teal,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    ],
  );
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? trailing;
  final bool danger;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: DarmaltonCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: ListTile(
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: danger
                ? DarmaltonColors.danger.withValues(alpha: 0.10)
                : DarmaltonColors.mint,
            borderRadius: BorderRadius.circular(DarmaltonRadius.small),
          ),
          child: Icon(
            icon,
            color: danger ? DarmaltonColors.danger : DarmaltonColors.teal,
          ),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: danger ? DarmaltonColors.danger : null,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (trailing != null)
              Text(trailing!, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_left_rounded),
          ],
        ),
      ),
    ),
  );
}
