import 'package:flutter_test/flutter_test.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';

void main() {
  test('category media survives API and offline cache serialization', () {
    final category = Category.fromJson({
      'id': 'category-1',
      'name': 'Vitamins',
      'name_dari': 'ویتامین‌ها',
      'slug': 'vitamins',
      'image_url':
          'http://192.168.0.110:8000/api/v1/categories/category-1/image/',
      'display_order': 3,
    });

    expect(category.imageUrl, contains('/categories/category-1/image/'));
    expect(category.displayOrder, 3);
    expect(Category.fromJson(category.toJson()).imageUrl, category.imageUrl);
  });

  test('category media remains optional for old offline cache entries', () {
    final category = Category.fromJson({
      'id': 'category-2',
      'name': 'Care',
      'name_dari': '',
      'slug': 'care',
    });

    expect(category.imageUrl, isEmpty);
    expect(category.displayOrder, 0);
  });
}
