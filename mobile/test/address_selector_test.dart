import 'package:darmalton_pharmacy/src/features/addresses/address_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets(
    'address editor supports manual fields and optional map location',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Consumer(
              builder: (context, ref, _) => Scaffold(
                body: FilledButton(
                  onPressed: () => showAddressEditor(context, ref),
                  child: const Text('افزودن آدرس'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('افزودن آدرس'));
      await tester.pumpAndSettle();

      expect(find.text('نام گیرنده'), findsOneWidget);
      expect(find.text('شماره تماس'), findsOneWidget);
      expect(find.text('آدرس دقیق'), findsOneWidget);
      expect(find.text('نشانی نزدیک'), findsOneWidget);
      expect(find.text('راهنمای تحویل'), findsOneWidget);
      expect(find.text('موقعیت فعلی'), findsOneWidget);
      expect(find.text('انتخاب روی نقشه'), findsOneWidget);

      await tester.ensureVisible(find.text('انتخاب روی نقشه'));
      await tester.tap(find.text('انتخاب روی نقشه'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('انتخاب موقعیت روی نقشه'), findsOneWidget);
      expect(find.text('استفاده از این موقعیت'), findsOneWidget);
    },
  );
}
