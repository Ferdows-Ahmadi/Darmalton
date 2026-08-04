import 'package:darmalton_pharmacy/src/app.dart';
import 'package:darmalton_pharmacy/src/core/app_settings.dart';
import 'package:darmalton_pharmacy/src/core/local_cache.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/core/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

const languageTestUser = User(
  id: 'language-user',
  email: 'language@example.test',
  firstName: 'Language',
  lastName: 'Tester',
  role: 'CUSTOMER',
);

class FixedLanguageAuthController extends AuthController {
  @override
  Future<User?> build() async => languageTestUser;

  @override
  Future<void> updatePreferredLanguage(String languageCode) async {}
}

class MemorySettingsCache extends LocalCacheStore {
  Map<String, dynamic> settings = {};

  @override
  Future<Map<String, dynamic>> readSettings() async => {...settings};

  @override
  Future<void> writeSettings(Map<String, dynamic> settings) async {
    this.settings = {...settings};
  }
}

Widget languageHarness(MemorySettingsCache cache) => ProviderScope(
  overrides: [
    localCacheProvider.overrideWithValue(cache),
    authProvider.overrideWith(FixedLanguageAuthController.new),
  ],
  child: const PharmacyApp(),
);

Future<void> pumpUi(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
}

void main() {
  test('Dari is the safe default and language round-trips', () {
    const settings = AppSettings();
    expect(settings.languageCode, 'fa');
    expect(
      AppSettings.fromJson(
        settings.copyWith(languageCode: 'en').toJson(),
      ).languageCode,
      'en',
    );
    expect(
      AppSettings.fromJson(const {'language_code': 'unknown'}).languageCode,
      'fa',
    );
  });

  testWidgets('language switches English and Dari with direction changes', (
    tester,
  ) async {
    final cache = MemorySettingsCache();
    await tester.pumpWidget(languageHarness(cache));
    await pumpUi(tester);
    expect(find.text('خانه'), findsWidgets);

    await tester.tap(find.text('تنظیمات').last);
    await pumpUi(tester);
    await tester.tap(find.text('زبان برنامه'));
    await pumpUi(tester);
    await tester.tap(find.text('English').first);
    await pumpUi(tester);

    expect(find.text('Home'), findsWidgets);
    expect(find.text('Settings'), findsWidgets);
    expect(find.text('Account and security'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('App language'), findsOneWidget);
    expect(cache.settings['language_code'], 'en');
    expect(
      tester
          .widget<Directionality>(find.byType(Directionality).last)
          .textDirection,
      TextDirection.ltr,
    );

    await tester.tap(find.text('App language'));
    await pumpUi(tester);
    await tester.tap(find.text('دری').first);
    await pumpUi(tester);

    expect(find.text('خانه'), findsWidgets);
    expect(cache.settings['language_code'], 'fa');
    expect(
      tester
          .widget<Directionality>(find.byType(Directionality).last)
          .textDirection,
      TextDirection.rtl,
    );
  });

  testWidgets('persisted English is restored after app restart', (
    tester,
  ) async {
    final cache = MemorySettingsCache()..settings = {'language_code': 'en'};
    await tester.pumpWidget(languageHarness(cache));
    await pumpUi(tester);
    expect(find.text('Home'), findsWidgets);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpWidget(languageHarness(cache));
    await pumpUi(tester);
    expect(find.text('Home'), findsWidgets);
  });

  testWidgets(
    'catalogue filters and sheet labels refresh without dismiss assertions',
    (tester) async {
      final cache = MemorySettingsCache();
      await tester.pumpWidget(languageHarness(cache));
      await pumpUi(tester);

      await tester.tap(find.byType(TextField).first);
      await pumpUi(tester);
      await tester.tap(find.text('فیلترها'));
      await pumpUi(tester);
      expect(find.text('فیلتر محصولات'), findsOneWidget);

      await tester.binding.handlePopRoute();
      await pumpUi(tester);
      expect(tester.takeException(), isNull);
      await tester.binding.handlePopRoute();
      await pumpUi(tester);

      await tester.tap(find.text('تنظیمات').last);
      await pumpUi(tester);
      await tester.tap(find.text('زبان برنامه'));
      await pumpUi(tester);
      await tester.tap(find.text('English').first);
      await pumpUi(tester);

      await tester.tap(find.byIcon(Icons.home_outlined));
      await pumpUi(tester);
      await tester.tap(find.byType(TextField).first);
      await pumpUi(tester);
      await tester.tap(find.text('Filters'));
      await pumpUi(tester);
      expect(find.text('Product filters'), findsOneWidget);
      expect(find.text('Apply filters'), findsOneWidget);

      await tester.binding.handlePopRoute();
      await pumpUi(tester);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('Home menu opens Account without a duplicate Settings action', (
    tester,
  ) async {
    final cache = MemorySettingsCache();
    await tester.pumpWidget(languageHarness(cache));
    await pumpUi(tester);

    await tester.tap(find.byKey(const Key('account-menu-button')));
    await pumpUi(tester);

    expect(find.text('حساب کاربری'), findsOneWidget);
    expect(find.byIcon(Icons.settings_outlined), findsNothing);
    expect(find.byType(NavigationBar), findsNothing);

    await tester.binding.handlePopRoute();
    await pumpUi(tester);
    expect(find.byKey(const Key('account-menu-button')), findsOneWidget);
  });
}
