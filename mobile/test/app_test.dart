import 'package:darmalton_pharmacy/src/core/api_client.dart';
import 'package:darmalton_pharmacy/src/core/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('API base URL is normalized consistently', () {
    expect(
      ApiClient.normalizeApiBaseUrl('http://127.0.0.1:8000/'),
      'http://127.0.0.1:8000/api/v1',
    );
    expect(
      ApiClient.normalizeApiBaseUrl('https://api.example.test/api/v1/'),
      'https://api.example.test/api/v1',
    );
    expect(
      ApiClient.normalizeApiBaseUrl('https://api.example.test/api'),
      'https://api.example.test/api/v1',
    );
  });

  testWidgets('Empty state gives actionable copy', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: EmptyMessage(
            'Your cart is empty',
            'Add an available medicine to continue.',
          ),
        ),
      ),
    );

    expect(find.text('Your cart is empty'), findsOneWidget);
    expect(find.textContaining('available medicine'), findsOneWidget);
  });
}
