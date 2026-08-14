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
        ],
      ),
    );
  }
}

({String title, IconData icon, String body}) _content(
  SettingsInfoKind kind,
) => switch (kind) {
  SettingsInfoKind.about => (
    title: DariStrings.t('درباره درملتون', 'About Darmalton'),
    icon: Icons.local_pharmacy_outlined,
    body: DariStrings.t(
      'درملتون یک سامانه فروش آنلاین دوا و محصولات صحی با تجربه نخست به زبان دری است. '
          'قیمت، موجودی، نسخه و وضعیت سفارش فقط از سرور معتبر داروخانه دریافت می‌شود.\n\n'
          'نسخه برنامه: ۱.۰.۰',
      'Darmalton is an online pharmacy for medicines and health products, designed Dari-first. '
          'Prices, stock, prescriptions, and order status come only from the trusted pharmacy server.\n\n'
          'App version: 1.0.0',
    ),
  ),
  SettingsInfoKind.terms => (
    title: DariStrings.t('شرایط استفاده', 'Terms of use'),
    icon: Icons.gavel_outlined,
    body: DariStrings.t(
      'از درملتون تنها برای سفارش قانونی و شخصی استفاده کنید. معلومات دوا آموزشی است و '
          'جای تشخیص یا نسخه داکتر را نمی‌گیرد. دواهای نسخه‌ای تنها پس از تأیید فارمسست '
          'قابل سفارش‌اند. سفارش، بازگشت و بازپرداخت تابع بررسی داروخانه است.',
      'Use Darmalton only for lawful personal orders. Medicine information is educational '
          'and does not replace diagnosis or a doctor\'s prescription. Prescription medicines '
          'can be ordered only after pharmacist approval. Orders, returns, and refunds are subject to pharmacy review.',
    ),
  ),
  SettingsInfoKind.privacy => (
    title: DariStrings.t('حریم خصوصی', 'Privacy'),
    icon: Icons.privacy_tip_outlined,
    body: DariStrings.t(
      'توکن ورود در ذخیره امن دستگاه نگهداری می‌شود. مشخصات عمومی کاتالوگ ممکن است برای '
          'استفاده آفلاین ذخیره شود، اما قیمت، موجودی، وضعیت سفارش، نسخه و پرداخت در کش عمومی '
          'ذخیره نمی‌شود. نسخه‌های ارسالی فقط برای مالک و کارکنان مجاز قابل دسترس است.',
      'The sign-in token is stored in secure device storage. Public catalogue details may be '
          'cached for offline use, but prices, stock, order status, prescriptions, and payments '
          'are never stored in the public cache. Uploaded prescriptions are visible only to their owner and authorized staff.',
    ),
  ),
  SettingsInfoKind.help => (
    title: DariStrings.t('مرکز کمک', 'Help center'),
    icon: Icons.support_agent_rounded,
    body: DariStrings.t(
      'برای مشکل ورود، سفارش یا نسخه ابتدا اتصال اینترنت را بررسی و صفحه را تازه کنید. '
          'اگر مشکل ادامه داشت، شماره سفارش یا نسخه را یادداشت و با پشتیبانی تماس بگیرید. '
          'هیچ‌گاه رمز عبور یا کد ورود خود را برای دیگران نفرستید.',
      'For sign-in, order, or prescription problems, first check your internet connection and refresh. '
          'If the problem continues, note the order or prescription number and contact support. '
          'Never share your password or sign-in code.',
    ),
  ),
  SettingsInfoKind.contact => (
    title: DariStrings.t('تماس با ما', 'Contact us'),
    icon: Icons.contact_support_outlined,
    body: DariStrings.t(
      'برای کمک درباره سفارش یا نسخه، شماره مربوط را یادداشت کنید و از راه تماس رسمی داروخانه استفاده نمایید.',
      'For help with an order or prescription, note its reference number and use the pharmacy’s official support channel.',
    ),
  ),
};
