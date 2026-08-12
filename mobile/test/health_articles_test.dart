import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('health articles select language and round trip cache fields', () {
    final article = HealthArticle.fromJson({
      'id': 'a1',
      'slug': 'safe-use',
      'title': 'Safe use',
      'title_dari': 'مصرف امن',
      'summary': 'Summary',
      'summary_dari': 'خلاصه',
      'body': 'Body',
      'body_dari': 'متن',
      'image_url': 'https://example.test/a.png',
      'alt_text': 'Health',
      'alt_text_dari': 'سلامت',
      'author_source': 'Pharmacy team',
      'display_order': 2,
    });
    expect(article.displayTitle, 'مصرف امن');
    expect(
      HealthArticle.fromJson(article.toJson()).authorSource,
      'Pharmacy team',
    );
    expect(normalizeHealthArticles([article]), hasLength(1));
  });
  test('health article normalization rejects empty body records', () {
    const invalid = HealthArticle(
      id: 'bad',
      slug: 'bad',
      title: '',
      titleDari: 'عنوان',
      summary: '',
      summaryDari: '',
      body: '',
      bodyDari: '',
      imageUrl: '',
      altText: '',
      altTextDari: '',
      authorSource: '',
      displayOrder: 0,
    );
    expect(normalizeHealthArticles([invalid]), isEmpty);
  });
}
