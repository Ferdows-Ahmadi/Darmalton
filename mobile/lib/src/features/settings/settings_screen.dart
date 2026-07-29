import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_settings.dart';
import '../../core/design_system.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _update(WidgetRef ref, AppSettings current, AppSettings next) =>
      ref.read(appSettingsProvider.notifier).save(next);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('تنظیمات')),
      body: settings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => AsyncMessage(
          message: '$error',
          onRetry: () => ref.invalidate(appSettingsProvider),
        ),
        data: (current) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            const _SettingsHeading(
              icon: Icons.manage_accounts_outlined,
              title: 'حساب و امنیت',
              subtitle: 'معلومات حساب، آدرس‌ها و گزینه‌های امنیتی.',
            ),
            DarmaltonCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(
                      Icons.person_outline_rounded,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('پروفایل'),
                    subtitle: const Text('نام و شماره تماس'),
                    trailing: const Icon(Icons.chevron_left_rounded),
                    onTap: () => context.push('/settings/profile'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.location_on_outlined,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('آدرس‌ها'),
                    subtitle: const Text('مشاهده و افزودن هنگام پرداخت'),
                    trailing: const Icon(Icons.chevron_left_rounded),
                    onTap: () => context.go('/profile'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.shield_outlined,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('امنیت و رمز عبور'),
                    subtitle: const Text('تغییر رمز و غیرفعال‌کردن حساب'),
                    trailing: const Icon(Icons.chevron_left_rounded),
                    onTap: () => context.push('/settings/security'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const _SettingsHeading(
              icon: Icons.language_rounded,
              title: 'زبان و خوانایی',
              subtitle: 'درملتون به‌صورت پیش‌فرض دری و راست‌به‌چپ است.',
            ),
            DarmaltonCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const ListTile(
                    leading: Icon(
                      Icons.translate_rounded,
                      color: DarmaltonColors.teal,
                    ),
                    title: Text('زبان برنامه'),
                    subtitle: Text('دری (افغانستان)'),
                    trailing: Icon(Icons.check_circle_rounded),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: const Icon(
                      Icons.text_increase_rounded,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('متن بزرگ‌تر'),
                    subtitle: const Text(
                      'خوانایی متن‌های اصلی را افزایش می‌دهد.',
                    ),
                    value: current.largerText,
                    onChanged: (value) => _update(
                      ref,
                      current,
                      current.copyWith(largerText: value),
                    ),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: const Icon(
                      Icons.motion_photos_off_outlined,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('کاهش حرکت'),
                    subtitle: const Text(
                      'حرکت صفحه‌ها و تصویرها را محدود می‌کند.',
                    ),
                    value: current.reduceMotion,
                    onChanged: (value) => _update(
                      ref,
                      current,
                      current.copyWith(reduceMotion: value),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const _SettingsHeading(
              icon: Icons.notifications_none_rounded,
              title: 'اعلان و حافظه',
              subtitle: 'انتخاب‌های این دستگاه؛ وضعیت زنده از سرور می‌آید.',
            ),
            DarmaltonCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    secondary: const Icon(
                      Icons.notifications_active_outlined,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('اعلان‌های برنامه'),
                    subtitle: const Text(
                      'یادآوری نسخه و سفارش در داخل برنامه.',
                    ),
                    value: current.notifications,
                    onChanged: (value) => _update(
                      ref,
                      current,
                      current.copyWith(notifications: value),
                    ),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: const Icon(
                      Icons.image_outlined,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('حفظ تصویرهای کوچک'),
                    subtitle: const Text('برای مرور سریع‌تر در اتصال ضعیف.'),
                    value: current.cacheThumbnails,
                    onChanged: (value) => _update(
                      ref,
                      current,
                      current.copyWith(cacheThumbnails: value),
                    ),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: const Icon(
                      Icons.history_rounded,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('حفظ جستجوهای اخیر'),
                    subtitle: const Text(
                      'عبارت‌ها فقط در همین دستگاه نگهداری می‌شوند.',
                    ),
                    value: current.rememberSearches,
                    onChanged: (value) => _update(
                      ref,
                      current,
                      current.copyWith(rememberSearches: value),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const _SettingsHeading(
              icon: Icons.shield_outlined,
              title: 'حریم خصوصی و داده',
              subtitle:
                  'قیمت، موجودی و وضعیت سفارش هرگز در کش عمومی ذخیره نمی‌شود.',
            ),
            DarmaltonCard(
              padding: EdgeInsets.zero,
              child: ListTile(
                leading: const Icon(
                  Icons.cleaning_services_outlined,
                  color: DarmaltonColors.teal,
                ),
                title: const Text('پاک‌کردن محتوای عمومی ذخیره‌شده'),
                subtitle: const Text(
                  'دسته‌بندی و مشخصات عمومی محصولات پاک می‌شود.',
                ),
                trailing: const Icon(Icons.chevron_left_rounded),
                onTap: () async {
                  await ref
                      .read(appSettingsProvider.notifier)
                      .clearPublicCache();
                  ref.invalidate(categoriesProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('محتوای عمومی ذخیره‌شده پاک شد.'),
                      ),
                    );
                  }
                },
              ),
            ),
            const SizedBox(height: 22),
            const _SettingsHeading(
              icon: Icons.help_outline_rounded,
              title: 'راهنما و معلومات',
              subtitle: 'سیاست‌ها، پشتیبانی و معلومات برنامه.',
            ),
            DarmaltonCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _SettingsLink(
                    icon: Icons.support_agent_rounded,
                    title: 'مرکز کمک',
                    onTap: () => context.push('/settings/help'),
                  ),
                  const Divider(height: 1),
                  _SettingsLink(
                    icon: Icons.contact_support_outlined,
                    title: 'تماس با ما',
                    onTap: () => context.push('/settings/contact'),
                  ),
                  const Divider(height: 1),
                  _SettingsLink(
                    icon: Icons.info_outline_rounded,
                    title: 'درباره درملتون',
                    onTap: () => context.push('/settings/about'),
                  ),
                  const Divider(height: 1),
                  _SettingsLink(
                    icon: Icons.gavel_outlined,
                    title: 'شرایط استفاده',
                    onTap: () => context.push('/settings/terms'),
                  ),
                  const Divider(height: 1),
                  _SettingsLink(
                    icon: Icons.privacy_tip_outlined,
                    title: 'سیاست حریم خصوصی',
                    onTap: () => context.push('/settings/privacy'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const DarmaltonCard(
              child: ListTile(
                leading: Icon(
                  Icons.info_outline_rounded,
                  color: DarmaltonColors.teal,
                ),
                title: Text('نسخه برنامه'),
                subtitle: Text('۱.۰.۰ (Milestone 1)'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsLink extends StatelessWidget {
  const _SettingsLink({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: DarmaltonColors.teal),
    title: Text(title),
    trailing: const Icon(Icons.chevron_left_rounded),
    onTap: onTap,
  );
}

class _SettingsHeading extends StatelessWidget {
  const _SettingsHeading({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
    child: Row(
      children: [
        Icon(icon, color: DarmaltonColors.teal),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ],
    ),
  );
}
