import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('prescription response keeps customer-safe workflow fields', () {
    final prescription = Prescription.fromJson({
      'id': 'prescription-1',
      'patient_name': 'احمد',
      'status': 'APPROVED',
      'customer_visible_note': 'یک بسته مجاز است.',
      'clarification_request': '',
      'customer_response': '',
      'created_at': '2026-07-28T10:00:00Z',
      'expires_at': '2026-08-28T10:00:00Z',
      'can_cancel': false,
      'can_respond': false,
      'authorized_medicines': [
        {
          'id': 'authorization-1',
          'medicine_id': 'medicine-1',
          'medicine_name': 'دوای آزمایشی',
          'max_quantity': 1,
          'instructions': 'طبق هدایت داکتر',
        },
      ],
      'history': [
        {
          'to_status': 'APPROVED',
          'action': 'approved',
          'customer_visible_note': 'تأیید شد.',
          'created_at': '2026-07-28T10:05:00Z',
        },
      ],
    });

    expect(prescription.status, 'APPROVED');
    expect(prescription.authorizedMedicines.single.maxQuantity, 1);
    expect(prescription.history.single.action, 'approved');
    expect(prescriptionStatusLabel(prescription.status), 'تأییدشده');
  });
}
