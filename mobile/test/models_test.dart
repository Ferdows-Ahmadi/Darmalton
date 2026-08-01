import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Medicine parses server money and inventory fields', () {
    final medicine = Medicine.fromJson({
      'id': 'medicine-id',
      'brand_name': 'TestMed',
      'generic_name': 'Ingredient',
      'strength': '500 mg',
      'dosage_form': {'name': 'Tablet'},
      'manufacturer': {'name': 'Maker'},
      'description': 'Description',
      'image_url': 'https://example.test/image.png',
      'prescription_required': false,
      'available_quantity': 4,
      'price': '125.50',
    });

    expect(medicine.brandName, 'TestMed');
    expect(medicine.price, '125.50');
    expect(medicine.inStock, isTrue);
  });

  test('Order status is readable', () {
    expect(readableStatus('READY_FOR_DELIVERY'), 'Ready For Delivery');
  });

  test('Order parses immutable item and delivery snapshots', () {
    final order = Order.fromJson({
      'id': 'order-id',
      'order_number': 'OP-TEST',
      'status': 'PENDING',
      'payment_status': 'UNPAID',
      'currency_code': 'AFN',
      'grand_total': '250.00',
      'delivery_address': {
        'recipient_name': 'Demo Customer',
        'street_address': 'Main Road',
        'city': 'Kabul',
      },
      'items': [
        {
          'id': 'item-id',
          'medicine_name': 'TestMed',
          'strength': '500 mg',
          'dosage_form': 'Tablet',
          'quantity': 2,
          'unit_price': '125.00',
          'line_total': '250.00',
        },
      ],
      'placed_at': '2026-07-24T00:00:00Z',
      'status_history': <Map<String, dynamic>>[],
    });

    expect(order.items.single.medicineName, 'TestMed');
    expect(order.deliveryAddress['city'], 'Kabul');
    expect(order.currencyCode, 'AFN');
  });

  test('Address preserves delivery and GPS fields in the private cache', () {
    final address = Address.fromJson({
      'id': 'address-id',
      'label': 'خانه',
      'recipient_name': 'مشتری',
      'recipient_phone': '0700000000',
      'province': 'کابل',
      'city': 'کابل',
      'district': '۴',
      'street_address': 'سرک اول',
      'landmark': 'نزدیک کلینیک',
      'delivery_instructions': 'دروازه را زنگ بزنید',
      'latitude': '34.555300',
      'longitude': '69.207500',
      'is_default': true,
    });

    expect(address.latitude, 34.5553);
    expect(address.longitude, 69.2075);
    expect(address.deliveryInstructions, 'دروازه را زنگ بزنید');
    expect(Address.fromJson(address.toJson()).toJson(), address.toJson());
  });
}
