import 'package:darmalton_pharmacy/src/core/app_settings.dart';
import 'package:darmalton_pharmacy/src/core/guest_session.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const medicine = Medicine(
    id: 'medicine-1',
    brandName: 'Panadol',
    brandNameDari: 'پانادول',
    genericName: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'Tablet',
    dosageFormDari: 'تابلیت',
    packSize: '24',
    categoryName: 'Pain relief',
    categoryNameDari: 'تسکین درد',
    manufacturer: 'Example',
    description: 'Example medicine',
    descriptionDari: 'داروی نمونه',
    imageUrl: 'https://example.test/medicine.png',
    prescriptionRequired: false,
    availableQuantity: 18,
    price: '120.00',
  );

  test('cached medicine metadata excludes live price and stock', () {
    final cached = medicine.toCacheJson();

    expect(cached['price'], isNull);
    expect(cached['available_quantity'], 0);
    expect(cached['brand_name_dari'], 'پانادول');
  });

  test('legacy guest cart values are sanitized while loading', () {
    final entry = GuestCartEntry.fromJson({
      'medicine': medicine.toJson(),
      'quantity': 2,
    });

    expect(entry.medicine.price, isNull);
    expect(entry.medicine.availableQuantity, 0);
    expect(entry.quantity, 2);
  });

  test('application settings round-trip with safe defaults', () {
    final settings = AppSettings.fromJson(const {
      'larger_text': true,
      'cache_thumbnails': false,
    });

    expect(settings.largerText, isTrue);
    expect(settings.cacheThumbnails, isFalse);
    expect(settings.reduceMotion, isFalse);
    expect(AppSettings.fromJson(settings.toJson()).toJson(), settings.toJson());
  });
}
