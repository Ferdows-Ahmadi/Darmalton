import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/core/strings.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('notification localizes and deep-links to its real resource', () {
    final item = AppNotification.fromJson({
      'id': 'notification-one',
      'kind': 'ORDER_STATUS_CHANGED',
      'title': 'سفارش تأیید شد',
      'message': 'داروخانه سفارش شما را تأیید کرده است.',
      'title_en': 'Order confirmed',
      'message_en': 'The pharmacy confirmed your order.',
      'prescription_id': null,
      'order_id': 'order-one',
      'read_at': null,
      'created_at': '2026-08-13T05:00:00Z',
    });

    DariStrings.configure('fa');
    expect(item.displayTitle, 'سفارش تأیید شد');
    expect(item.destination, '/orders/order-one');
    expect(item.isRead, isFalse);

    DariStrings.configure('en');
    addTearDown(() => DariStrings.configure('fa'));
    expect(item.displayTitle, 'Order confirmed');
    expect(item.displayMessage, 'The pharmacy confirmed your order.');
  });

  test('prescription exposes the safe bundle action from server state', () {
    final prescription = Prescription.fromJson({
      'id': 'prescription-one',
      'patient_name': '',
      'status': 'APPROVED',
      'customer_visible_note': '',
      'clarification_request': '',
      'customer_response': '',
      'created_at': '2026-08-13T05:00:00Z',
      'can_cancel': false,
      'can_respond': false,
      'can_add_to_cart': true,
      'expires_at': '2026-09-13T05:00:00Z',
      'authorized_medicines': [
        {
          'id': 'authorization-one',
          'medicine_id': 'medicine-one',
          'medicine_name': 'Test medicine',
          'max_quantity': 2,
          'instructions': 'Use as directed',
        },
      ],
      'history': [],
    });

    expect(prescription.canAddToCart, isTrue);
    expect(prescription.authorizedMedicines.single.maxQuantity, 2);
  });
}
