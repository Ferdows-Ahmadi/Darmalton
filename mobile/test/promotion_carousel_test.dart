import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/features/catalog/promotion_carousel.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

PromotionalBanner banner(int index, {String actionUrl = ''}) =>
    PromotionalBanner(
      id: 'banner-$index',
      title: 'Banner $index',
      titleDari: 'بنر $index',
      imageUrl: 'https://example.test/banner-$index.png',
      altText: 'Promotion $index',
      altTextDari: 'تخفیف $index',
      actionUrl: actionUrl,
      displayOrder: index,
    );

void main() {
  test('banner links accept only routes implemented by the app', () {
    expect(bannerAppLocation('/search?category=vitamins'), isNotNull);
    expect(bannerAppLocation('/medicines/medicine-id'), isNotNull);
    expect(bannerAppLocation('/staff'), isNull);
    expect(bannerAppLocation('//attacker.test/path'), isNull);
    expect(bannerAppLocation('https://attacker.test/path'), isNull);
  });

  test('banner JSON cache round-trip preserves client fields', () {
    final original = banner(1, actionUrl: '/catalogue');
    final cached = PromotionalBanner.fromJson(original.toJson());
    expect(cached.id, original.id);
    expect(cached.imageUrl, original.imageUrl);
    expect(cached.actionUrl, '/catalogue');
    expect(cached.displayOrder, 1);
  });

  test(
    'banner normalization removes unusable images, orders, and caps at ten',
    () {
      final items = [
        ...List.generate(11, (index) => banner(11 - index)),
        const PromotionalBanner(
          id: 'missing-image',
          title: '',
          titleDari: '',
          imageUrl: '',
          altText: '',
          altTextDari: '',
          actionUrl: '',
          displayOrder: 0,
        ),
      ];

      final normalized = normalizePromotionalBanners(items);
      expect(normalized, hasLength(10));
      expect(
        normalized.map((item) => item.displayOrder),
        orderedEquals(List.generate(10, (index) => index + 1)),
      );
    },
  );

  testWidgets('zero banners hides the promotion section', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: PromotionCarousel(banners: [])),
    );
    expect(find.byKey(const Key('cms-promotion-carousel')), findsNothing);
  });

  testWidgets('one banner is stable and has no page indicators', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: PromotionCarousel(banners: [banner(1)])),
    );
    await tester.pump();

    expect(find.byKey(const Key('cms-promotion-carousel')), findsOneWidget);
    expect(find.byKey(const Key('banner-dot-0')), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('multiple banners are capped at ten and show indicators', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: PromotionCarousel(
          banners: List.generate(12, (index) => banner(index)),
        ),
      ),
    );
    await tester.pump();

    expect(find.byKey(const Key('banner-dot-0')), findsOneWidget);
    expect(find.byKey(const Key('banner-dot-9')), findsOneWidget);
    expect(find.byKey(const Key('banner-dot-10')), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('four banners can be swiped and update the indicator', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SizedBox(
          width: 400,
          child: PromotionCarousel(
            banners: List.generate(4, (index) => banner(index)),
          ),
        ),
      ),
    );
    await tester.pump();
    expect(find.bySemanticsLabel('Banner 1 of 4'), findsOneWidget);

    await tester.fling(
      find.byKey(const Key('cms-promotion-carousel')),
      const Offset(-600, 0),
      1200,
    );
    await tester.pump(const Duration(seconds: 1));

    expect(find.bySemanticsLabel('Banner 2 of 4'), findsOneWidget);
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
