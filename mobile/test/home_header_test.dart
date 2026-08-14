import 'package:darmalton_pharmacy/src/core/strings.dart';
import 'package:darmalton_pharmacy/src/features/catalog/catalogue_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget headerHarness(TextDirection direction) => MaterialApp(
  home: Directionality(
    textDirection: direction,
    child: Scaffold(
      appBar: HomeAppBar(
        showNotifications: true,
        unreadNotifications: 2,
        onNotifications: () {},
        onMenu: () {},
      ),
    ),
  ),
);

void main() {
  Future<void> verifyPhysicalEdges(
    WidgetTester tester,
    TextDirection direction,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(headerHarness(direction));
    await tester.pumpAndSettle();

    final menu = tester.getRect(find.byKey(const Key('account-menu-button')));
    final notifications = tester.getRect(
      find.byKey(const Key('notification-button')),
    );
    final wordmark = tester.getRect(find.byKey(const Key('home-wordmark')));

    expect(menu.left, lessThan(8));
    expect(notifications.right, greaterThan(312));
    expect(menu.right, lessThan(wordmark.left));
    expect(notifications.left, greaterThan(wordmark.right));
    expect(tester.takeException(), isNull);
  }

  testWidgets('Home header pins menu left and notifications right in RTL', (
    tester,
  ) async {
    DariStrings.configure('fa');
    await verifyPhysicalEdges(tester, TextDirection.rtl);
  });

  testWidgets('Home header pins menu left and notifications right in LTR', (
    tester,
  ) async {
    DariStrings.configure('en');
    addTearDown(() => DariStrings.configure('fa'));
    await verifyPhysicalEdges(tester, TextDirection.ltr);
  });
}
