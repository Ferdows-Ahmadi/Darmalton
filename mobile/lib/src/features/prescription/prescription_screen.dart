import 'package:flutter/material.dart';

import '../../core/design_system.dart';
import '../../core/widgets.dart';

class PrescriptionScreen extends StatelessWidget {
  const PrescriptionScreen({super.key});

  void _explain(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'آپلود و بررسی نسخه پس از اضافه‌شدن روند امن سرور فعال می‌شود.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => MainScaffold(
    index: 2,
    child: Scaffold(
      appBar: AppBar(title: const Text('ارسال نسخه')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: DarmaltonColors.mint,
              borderRadius: BorderRadius.circular(DarmaltonRadius.large),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'نسخه داکتر خود را ارسال کنید',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 19,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'این قابلیت هنوز به روند بررسی فارمسست متصل نشده است. '
                        'تا فعال‌شدن سرور، نسخه از این صفحه ارسال نمی‌شود.',
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 14),
                Icon(
                  Icons.assignment_add,
                  size: 76,
                  color: DarmaltonColors.teal,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(DarmaltonRadius.large),
              border: Border.all(
                color: DarmaltonColors.teal,
                style: BorderStyle.solid,
              ),
            ),
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 42,
                  backgroundColor: DarmaltonColors.mint,
                  foregroundColor: DarmaltonColors.teal,
                  child: Icon(Icons.cloud_upload_outlined, size: 46),
                ),
                const SizedBox(height: 12),
                const Text(
                  'نسخه خود را اینجا آپلود کنید',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const Text(
                  'فرمت‌های برنامه‌ریزی‌شده: JPG، PNG، PDF تا ۱۰ مگابایت',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _explain(context),
                        icon: const Icon(Icons.camera_alt_outlined),
                        label: const Text('گرفتن عکس'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _explain(context),
                        icon: const Icon(Icons.photo_library_outlined),
                        label: const Text('انتخاب فایل'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const DarmaltonCard(
            child: Column(
              children: [
                TextField(
                  enabled: false,
                  decoration: InputDecoration(
                    labelText: 'نام مریض (اختیاری)',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                SizedBox(height: 12),
                TextField(
                  enabled: false,
                  decoration: InputDecoration(
                    labelText: 'شماره تماس',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                ),
                SizedBox(height: 12),
                TextField(
                  enabled: false,
                  minLines: 2,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'یادداشت (اختیاری)',
                    prefixIcon: Icon(Icons.edit_note_outlined),
                  ),
                ),
                SizedBox(height: 12),
                TextField(
                  enabled: false,
                  decoration: InputDecoration(
                    labelText: 'ترجیح تحویل',
                    hintText: 'تحویل درب منزل',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('روند بررسی', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          const _ReviewProcess(),
          const SizedBox(height: 16),
          const GradientButton(
            label: 'ارسال نسخه به‌زودی',
            icon: Icons.send_outlined,
            onPressed: null,
          ),
        ],
      ),
    ),
  );
}

class _ReviewProcess extends StatelessWidget {
  const _ReviewProcess();

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 18),
    child: const Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _Step(
            number: '۱',
            icon: Icons.cloud_upload_outlined,
            title: 'ارسال نسخه',
          ),
        ),
        Expanded(
          child: _Step(
            number: '۲',
            icon: Icons.support_agent_rounded,
            title: 'بررسی فارمسست',
          ),
        ),
        Expanded(
          child: _Step(
            number: '۳',
            icon: Icons.medication_outlined,
            title: 'تأیید دواها',
          ),
        ),
        Expanded(
          child: _Step(
            number: '۴',
            icon: Icons.local_shipping_outlined,
            title: 'تحویل',
          ),
        ),
      ],
    ),
  );
}

class _Step extends StatelessWidget {
  const _Step({required this.number, required this.icon, required this.title});

  final String number;
  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Badge(
        label: Text(number),
        backgroundColor: DarmaltonColors.teal,
        child: CircleAvatar(
          radius: 28,
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(icon),
        ),
      ),
      const SizedBox(height: 8),
      Text(
        title,
        maxLines: 2,
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      ),
    ],
  );
}
