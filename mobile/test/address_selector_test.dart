import 'package:darmalton_pharmacy/src/features/addresses/address_selector.dart';
import 'package:darmalton_pharmacy/src/features/checkout/checkout_screen.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const defaultAddress = Address(
    id: 'default',
    label: 'Home',
    recipientName: 'Customer',
    recipientPhone: '+93700123456',
    province: 'Kabul',
    city: 'Kabul',
    district: '',
    streetAddress: 'Street 1',
    landmark: '',
    deliveryInstructions: '',
    isDefault: true,
  );
  const selectedAddress = Address(
    id: 'selected',
    label: 'Office',
    recipientName: 'Customer',
    recipientPhone: '+93700123456',
    province: 'Kabul',
    city: 'Kabul',
    district: '',
    streetAddress: 'Street 2',
    landmark: '',
    deliveryInstructions: '',
    isDefault: false,
  );

  test('checkout waits for and restores the persisted address selection', () {
    expect(
      resolveCheckoutAddressId(
        addresses: const [defaultAddress, selectedAddress],
        currentId: null,
        persistedId: null,
        selectionInitialized: false,
        persistedSelectionLoaded: false,
      ),
      isNull,
    );
    expect(
      resolveCheckoutAddressId(
        addresses: const [defaultAddress, selectedAddress],
        currentId: null,
        persistedId: selectedAddress.id,
        selectionInitialized: false,
        persistedSelectionLoaded: true,
      ),
      selectedAddress.id,
    );
  });

  test(
    'checkout keeps a newly selected valid address during provider refresh',
    () {
      expect(
        resolveCheckoutAddressId(
          addresses: const [defaultAddress, selectedAddress],
          currentId: selectedAddress.id,
          persistedId: defaultAddress.id,
          selectionInitialized: true,
          persistedSelectionLoaded: true,
        ),
        selectedAddress.id,
      );
    },
  );

  test('deleting an unrelated address preserves the selected address', () {
    expect(
      shouldClearSelectedAddress(
        selectedAddressId: selectedAddress.id,
        deletedAddressId: defaultAddress.id,
      ),
      isFalse,
    );
    expect(
      shouldClearSelectedAddress(
        selectedAddressId: selectedAddress.id,
        deletedAddressId: selectedAddress.id,
      ),
      isTrue,
    );
  });

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

      await tester.tap(find.text('لغو').last);
      await tester.pumpAndSettle();

      expect(find.text('انتخاب موقعیت روی نقشه'), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
}
