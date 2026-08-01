import 'package:darmalton_pharmacy/src/core/providers.dart';
import 'package:darmalton_pharmacy/src/core/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

Widget navigationHarness({required String initialLocation}) {
  final router = GoRouter(
    initialLocation: initialLocation,
    routes: [
      GoRoute(
        path: '/catalogue',
        builder: (_, _) => MainScaffold(
          index: 2,
          child: Scaffold(
            body: Builder(
              builder: (context) => TextButton(
                onPressed: () => context.push('/medicines/one'),
                child: const Text('خانه'),
              ),
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/orders',
        builder: (_, _) => const MainScaffold(
          index: 1,
          child: Scaffold(body: Text('سفارش‌ها')),
        ),
      ),
      GoRoute(
        path: '/medicines/:id',
        builder: (_, _) => const MainScaffold(
          index: 2,
          fallbackPath: '/catalogue',
          child: Scaffold(body: Text('جزئیات محصول')),
        ),
      ),
    ],
  );
  return ProviderScope(child: MaterialApp.router(routerConfig: router));
}

void main() {
  test('offline banner dismissal lasts until a new outage', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(offlineProvider.notifier).markOffline();
    expect(container.read(offlineProvider), isTrue);
    expect(container.read(offlineBannerVisibleProvider), isTrue);

    container.read(offlineBannerVisibleProvider.notifier).dismiss();
    container.read(offlineProvider.notifier).markOffline();
    expect(container.read(offlineBannerVisibleProvider), isFalse);

    container.read(offlineProvider.notifier).markOnline();
    container.read(offlineProvider.notifier).markOffline();
    expect(container.read(offlineBannerVisibleProvider), isTrue);
  });

  testWidgets('back from a non-home root returns to Home', (tester) async {
    await tester.pumpWidget(navigationHarness(initialLocation: '/orders'));
    await tester.pumpAndSettle();

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.text('خانه'), findsWidgets);
    expect(find.text('سفارش‌ها'), findsNothing);
  });

  testWidgets('back from a nested route returns to its previous route', (
    tester,
  ) async {
    await tester.pumpWidget(navigationHarness(initialLocation: '/catalogue'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'خانه'));
    await tester.pumpAndSettle();
    expect(find.text('جزئیات محصول'), findsOneWidget);

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.text('جزئیات محصول'), findsNothing);
    expect(find.text('خانه'), findsWidgets);
  });

  testWidgets('direct nested route has a safe catalogue fallback', (
    tester,
  ) async {
    await tester.pumpWidget(
      navigationHarness(initialLocation: '/medicines/one'),
    );
    await tester.pumpAndSettle();

    await tester.binding.handlePopRoute();
    await tester.pumpAndSettle();

    expect(find.text('خانه'), findsWidgets);
  });

  testWidgets('first back on Home shows the Dari second-back message', (
    tester,
  ) async {
    await tester.pumpWidget(navigationHarness(initialLocation: '/catalogue'));
    await tester.pumpAndSettle();

    await tester.binding.handlePopRoute();
    await tester.pump();

    expect(
      find.text('برای خروج، دکمه برگشت را دوباره فشار دهید.'),
      findsOneWidget,
    );
  });
}
