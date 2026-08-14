import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_settings.dart';
import '../../core/api_endpoint_manager.dart';
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';
import '../addresses/address_selector.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  Future<void> _update(WidgetRef ref, AppSettings current, AppSettings next) =>
      ref.read(appSettingsProvider.notifier).save(next);

  Future<void> _selectLanguage(
    BuildContext context,
    WidgetRef ref,
    AppSettings current,
  ) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                DariStrings.t('زبان برنامه', 'App language'),
                style: Theme.of(context).textTheme.titleLarge,
              ),
              ListTile(
                title: const Text('دری'),
                subtitle: const Text('Dari'),
                trailing: current.languageCode == 'fa'
                    ? const Icon(
                        Icons.check_circle,
                        color: DarmaltonColors.teal,
                      )
                    : null,
                onTap: () => Navigator.pop(context, 'fa'),
              ),
              ListTile(
                title: const Text('English'),
                subtitle: const Text('انگلیسی'),
                trailing: current.languageCode == 'en'
                    ? const Icon(
                        Icons.check_circle,
                        color: DarmaltonColors.teal,
                      )
                    : null,
                onTap: () => Navigator.pop(context, 'en'),
              ),
            ],
          ),
        ),
      ),
    );
    if (selected == null || selected == current.languageCode) return;
    await _update(ref, current, current.copyWith(languageCode: selected));
    try {
      await ref.read(authProvider.notifier).updatePreferredLanguage(selected);
    } on Object {
      // The local preference remains valid offline and will be synchronized
      // after the authenticated account is reachable again.
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsProvider);
    return MainScaffold(
      index: 4,
      child: Scaffold(
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
                      subtitle: const Text('انتخاب، افزودن و ویرایش'),
                      trailing: const Icon(Icons.chevron_left_rounded),
                      onTap: () => showAddressSelector(context, ref),
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
                    ListTile(
                      leading: const Icon(
                        Icons.translate_rounded,
                        color: DarmaltonColors.teal,
                      ),
                      title: Text(DariStrings.t('زبان برنامه', 'App language')),
                      subtitle: Text(
                        current.languageCode == 'en'
                            ? 'English'
                            : 'دری (افغانستان)',
                      ),
                      trailing: const Icon(Icons.chevron_left_rounded),
                      onTap: () => _selectLanguage(context, ref, current),
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
              if (kDebugMode) ...[
                DevelopmentDiagnosticsCard(
                  manager: ref.watch(apiEndpointManagerProvider),
                ),
                const SizedBox(height: 22),
              ],
              const DarmaltonCard(
                child: ListTile(
                  leading: Icon(
                    Icons.info_outline_rounded,
                    color: DarmaltonColors.teal,
                  ),
                  title: Text('نسخه برنامه'),
                  subtitle: Text('۱.۰.۰'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DevelopmentDiagnosticsScreen extends ConsumerWidget {
  const DevelopmentDiagnosticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: const Text('تشخیص اتصال توسعه')),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        DevelopmentDiagnosticsCard(
          manager: ref.watch(apiEndpointManagerProvider),
        ),
      ],
    ),
  );
}

class DevelopmentDiagnosticsCard extends StatefulWidget {
  const DevelopmentDiagnosticsCard({required this.manager, super.key});

  final ApiEndpointManager manager;

  @override
  State<DevelopmentDiagnosticsCard> createState() =>
      _DevelopmentDiagnosticsState();
}

class _DevelopmentDiagnosticsState extends State<DevelopmentDiagnosticsCard> {
  String _methodLabel(ApiConnectionMethod method) => switch (method) {
    ApiConnectionMethod.usb => 'USB',
    ApiConnectionMethod.lan => 'LAN',
    ApiConnectionMethod.rememberedLan => 'LAN ذخیره‌شده',
    ApiConnectionMethod.manual => 'دستی',
    ApiConnectionMethod.production => 'تولید',
    ApiConnectionMethod.offline => 'آفلاین',
  };

  Future<void> _editOverride() async {
    final controller = TextEditingController(
      text: await widget.manager.getManualEndpoint() ?? '',
    );
    if (!mounted) return;
    final value = await showDialog<String?>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('نشانی دستی برای توسعه'),
        content: TextField(
          controller: controller,
          textDirection: TextDirection.ltr,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(
            hintText: 'http://192.168.x.x:8000/api/v1',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لغو'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, ''),
            child: const Text('پاک‌کردن'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('ذخیره'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (value == null || !mounted) return;
    try {
      await widget.manager.setManualEndpoint(value);
    } on FormatException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: widget.manager,
    builder: (context, _) {
      final state = widget.manager.snapshot;
      final lastSuccess = state.lastSuccessfulConnection?.toLocal();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SettingsHeading(
            icon: Icons.developer_mode_rounded,
            title: 'تشخیص اتصال توسعه',
            subtitle: 'ابزار بررسی اتصال محلی و نشانی سرور توسعه.',
          ),
          DarmaltonCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ListTile(
                  leading: Icon(
                    state.healthy
                        ? Icons.cloud_done_outlined
                        : Icons.cloud_off_outlined,
                    color: state.healthy
                        ? DarmaltonColors.teal
                        : Theme.of(context).colorScheme.error,
                  ),
                  title: Text(
                    state.resolving
                        ? 'در حال بررسی اتصال…'
                        : state.healthy
                        ? 'بک‌اند در دسترس است'
                        : 'بک‌اند در دسترس نیست',
                  ),
                  subtitle: Text(
                    '${_methodLabel(state.method)}\n${state.endpoint}',
                    textDirection: TextDirection.ltr,
                  ),
                  isThreeLine: true,
                ),
                if (lastSuccess != null) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.schedule_rounded,
                      color: DarmaltonColors.teal,
                    ),
                    title: const Text('آخرین اتصال موفق'),
                    subtitle: Text(
                      lastSuccess.toIso8601String(),
                      textDirection: TextDirection.ltr,
                    ),
                  ),
                ],
                const Divider(height: 1),
                Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        onPressed: state.resolving
                            ? null
                            : widget.manager.retryAndDiscover,
                        icon: const Icon(Icons.sync_rounded),
                        label: const Text('تلاش و کشف دوباره'),
                      ),
                    ),
                    Expanded(
                      child: TextButton.icon(
                        onPressed: _editOverride,
                        icon: const Icon(Icons.tune_rounded),
                        label: const Text('نشانی دستی'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      );
    },
  );
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
