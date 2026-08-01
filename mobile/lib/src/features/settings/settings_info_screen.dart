import 'package:flutter/material.dart' hide Text;

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/strings.dart';

enum SettingsInfoKind { about, terms, privacy, help, contact }

class SettingsInfoScreen extends StatelessWidget {
  const SettingsInfoScreen({required this.kind, super.key});

  final SettingsInfoKind kind;

  @override
  Widget build(BuildContext context) {
    final content = _content(kind);
    return Scaffold(
      appBar: AppBar(title: Text(content.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DarmaltonCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(content.icon, size: 40, color: DarmaltonColors.teal),
                const SizedBox(height: 14),
                Text(
                  content.title,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 10),
                Text(content.body),
              ],
            ),
          ),
          if (kind == SettingsInfoKind.contact) ...[
            const SizedBox(height: 12),
            const DarmaltonCard(
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.phone_outlined),
                    title: Text('شماره نمایشی'),
                    subtitle: LtrText('+93 700 000 000'),
                  ),
                  Divider(),
                  ListTile(
                    leading: Icon(Icons.email_outlined),
                    title: Text('ایمیل پشتیبانی'),
                    subtitle: LtrText('support@darmalton.example'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

({String title, IconData icon, String body}) _content(
  SettingsInfoKind kind,
) => switch (kind) {
  SettingsInfoKind.about => (
    title: 'درباره ${DariStrings.appName}',
    icon: Icons.local_pharmacy_outlined,
    body:
        'درملتون یک سامانه فروش آنلاین دوا و محصولات صحی با تجربه نخست به زبان دری است. '
        'قیمت، موجودی، نسخه و وضعیت سفارش فقط از سرور معتبر داروخانه دریافت می‌شود.\n\n'
        'نسخه برنامه: ۱.۰.۰ (Milestone 1)',
  ),
  SettingsInfoKind.terms => (
    title: 'شرایط استفاده',
    icon: Icons.gavel_outlined,
    body:
        'از درملتون تنها برای سفارش قانونی و شخصی استفاده کنید. معلومات دوا آموزشی است و '
        'جای تشخیص یا نسخه داکتر را نمی‌گیرد. دواهای نسخه‌ای تنها پس از تأیید فارمسست '
        'قابل سفارش‌اند. سفارش، بازگشت و بازپرداخت تابع بررسی داروخانه است.',
  ),
  SettingsInfoKind.privacy => (
    title: 'حریم خصوصی',
    icon: Icons.privacy_tip_outlined,
    body:
        'توکن ورود در ذخیره امن دستگاه نگهداری می‌شود. مشخصات عمومی کاتالوگ ممکن است برای '
        'استفاده آفلاین ذخیره شود، اما قیمت، موجودی، وضعیت سفارش، نسخه و پرداخت در کش عمومی '
        'ذخیره نمی‌شود. نسخه‌های ارسالی فقط برای مالک و کارکنان مجاز قابل دسترس است.',
  ),
  SettingsInfoKind.help => (
    title: 'مرکز کمک',
    icon: Icons.support_agent_rounded,
    body:
        'برای مشکل ورود، سفارش یا نسخه ابتدا اتصال اینترنت را بررسی و صفحه را تازه کنید. '
        'اگر مشکل ادامه داشت، شماره سفارش یا نسخه را یادداشت و با پشتیبانی تماس بگیرید. '
        'هیچ‌گاه رمز عبور یا کد ورود خود را برای دیگران نفرستید.',
  ),
  SettingsInfoKind.contact => (
    title: 'تماس با ما',
    icon: Icons.contact_support_outlined,
    body:
        'راه‌های زیر برای محیط نمایشی هستند. پیش از انتشار، شماره، ایمیل، ساعت کاری و آدرس '
        'داروخانه دارای جواز باید با اطلاعات واقعی جایگزین شود.',
  ),
};
