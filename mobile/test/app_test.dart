import 'package:darmalton_pharmacy/src/core/api_client.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
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

  testWidgets('Server fallback URL uses the local neutral image state', (
    tester,
  ) async {
    const medicine = Medicine(
      id: 'medicine-id',
      brandName: 'Medicine',
      brandNameDari: 'دوا',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      dosageFormDari: 'قرص',
      packSize: '',
      categoryName: '',
      categoryNameDari: '',
      manufacturer: '',
      description: '',
      descriptionDari: '',
      imageUrl: 'http://127.0.0.1:8000/static/medicine-fallback.svg',
      prescriptionRequired: false,
      availableQuantity: 1,
      price: '10.00',
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: MedicineImage(medicine: medicine)),
      ),
    );

    expect(find.byIcon(Icons.medication_liquid_outlined), findsOneWidget);
    expect(find.text('دوای درملتون'), findsOneWidget);
  });

  testWidgets('Google authentication button exposes its configured state', (
    tester,
  ) async {
    var pressed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GoogleAuthButton(
            label: 'ادامه با گوگل',
            enabled: true,
            onPressed: () => pressed = true,
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('google-auth-button')));
    expect(pressed, isTrue);
    expect(find.text('ادامه با گوگل'), findsOneWidget);
    expect(find.bySemanticsLabel('Google'), findsOneWidget);
  });

  testWidgets('Google authentication button is disabled while unconfigured', (
    tester,
  ) async {
    var pressed = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GoogleAuthButton(
            label: 'ادامه با گوگل',
            enabled: false,
            onPressed: () => pressed = true,
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('google-auth-button')));
    expect(pressed, isFalse);
  });
}
