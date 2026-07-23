import 'package:darmalton_pharmacy/src/core/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Empty state gives actionable copy', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: EmptyMessage('Your cart is empty', 'Add an available medicine to continue.'),
        ),
      ),
    );

    expect(find.text('Your cart is empty'), findsOneWidget);
    expect(find.textContaining('available medicine'), findsOneWidget);
  });
}
