import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/providers.dart';
import '../../core/phone_number.dart';
import '../../core/strings.dart';

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _phone;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).value;
    _firstName = TextEditingController(text: user?.firstName ?? '');
    _lastName = TextEditingController(text: user?.lastName ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(authProvider.notifier)
          .updateProfile(
            firstName: _firstName.text,
            lastName: _lastName.text,
            phone: _phone.text.trim().isEmpty
                ? ''
                : normalizeAfghanPhone(_phone.text),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('معلومات پروفایل ذخیره شد.')),
        );
        context.pop();
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('ویرایش پروفایل')),
    body: Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _AccountHeader(
            icon: Icons.manage_accounts_outlined,
            title: 'معلومات حساب',
            subtitle: 'ایمیل حساب برای امنیت از داخل برنامه تغییر نمی‌کند.',
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _firstName,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              labelText: DariStrings.translate('نام'),
              prefixIcon: const Icon(Icons.person_outline_rounded),
            ),
            validator: (value) => value?.trim().isEmpty == true
                ? DariStrings.translate('نام را وارد کنید.')
                : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _lastName,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(
              labelText: DariStrings.translate('نام خانوادگی'),
              prefixIcon: const Icon(Icons.badge_outlined),
            ),
            validator: (value) => value?.trim().isEmpty == true
                ? DariStrings.t(
                    'نام خانوادگی را وارد کنید.',
                    'Enter a last name.',
                  )
                : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(
              labelText: DariStrings.translate('شماره تماس'),
              prefixIcon: const Icon(Icons.phone_outlined),
            ),
            validator: (value) => validateAfghanPhone(value, optional: true),
          ),
          const SizedBox(height: 22),
          GradientButton(
            label: 'ذخیره تغییرات',
            icon: Icons.save_outlined,
            loading: _saving,
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
    ),
  );
}

class SecuritySettingsScreen extends ConsumerStatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  ConsumerState<SecuritySettingsScreen> createState() =>
      _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState
    extends ConsumerState<SecuritySettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(authProvider.notifier)
          .changePassword(
            currentPassword: _current.text,
            newPassword: _next.text,
          );
      _current.clear();
      _next.clear();
      _confirm.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('رمز عبور با موفقیت تغییر کرد.')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deactivate() async {
    final user = ref.read(authProvider).value;
    if (user == null) return;
    final password = TextEditingController();
    final email = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('غیرفعال‌کردن حساب'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              DariStrings.t(
                'ورود به حساب متوقف می‌شود و سفارش‌های تاریخی برای الزامات '
                    'داروخانه محفوظ می‌ماند. برای فعال‌سازی دوباره با پشتیبانی تماس بگیرید.',
                'Sign-in will be disabled, while historical orders remain available '
                    'for pharmacy obligations. Contact support to reactivate your account.',
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: email,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(
                labelText: DariStrings.t(
                  'برای تأیید بنویسید: ${user.email}',
                  'Type ${user.email} to confirm',
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: password,
              obscureText: true,
              textDirection: TextDirection.ltr,
              decoration: InputDecoration(
                labelText: DariStrings.t('رمز عبور فعلی', 'Current password'),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('انصراف'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: DarmaltonColors.danger,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('غیرفعال‌کردن'),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      password.dispose();
      email.dispose();
      return;
    }
    try {
      await ref
          .read(authProvider.notifier)
          .deactivateAccount(
            currentPassword: password.text,
            confirmation: email.text,
          );
      if (mounted) context.go('/catalogue');
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      password.dispose();
      email.dispose();
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('امنیت حساب')),
    body: Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _AccountHeader(
            icon: Icons.lock_outline_rounded,
            title: 'تغییر رمز عبور',
            subtitle: 'یک رمز یکتا و حداقل هشت‌حرفی انتخاب کنید.',
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _current,
            obscureText: true,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(
              labelText: DariStrings.t('رمز عبور فعلی', 'Current password'),
            ),
            validator: (value) => value?.isEmpty == true
                ? DariStrings.translate('رمز فعلی را وارد کنید.')
                : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _next,
            obscureText: true,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(
              labelText: DariStrings.t('رمز عبور جدید', 'New password'),
            ),
            validator: (value) => (value?.length ?? 0) < 8
                ? DariStrings.translate('رمز جدید باید حداقل هشت حرف باشد.')
                : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _confirm,
            obscureText: true,
            textDirection: TextDirection.ltr,
            decoration: InputDecoration(
              labelText: DariStrings.translate('تکرار رمز جدید'),
            ),
            validator: (value) => value != _next.text
                ? DariStrings.translate('دو رمز جدید یکسان نیست.')
                : null,
          ),
          const SizedBox(height: 20),
          GradientButton(
            label: 'تغییر رمز عبور',
            icon: Icons.password_rounded,
            loading: _saving,
            onPressed: _saving ? null : _changePassword,
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: DarmaltonColors.danger,
              side: const BorderSide(color: DarmaltonColors.danger),
            ),
            onPressed: _deactivate,
            icon: const Icon(Icons.person_off_outlined),
            label: const Text('غیرفعال‌کردن حساب'),
          ),
        ],
      ),
    ),
  );
}

class _AccountHeader extends StatelessWidget {
  const _AccountHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: Row(
      children: [
        CircleAvatar(
          radius: 28,
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(icon, size: 30),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              Text(subtitle),
            ],
          ),
        ),
      ],
    ),
  );
}
