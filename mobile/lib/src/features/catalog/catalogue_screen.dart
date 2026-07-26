import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class CatalogueScreen extends ConsumerWidget {
  const CatalogueScreen({super.key});

  Future<void> _addToCart(
    BuildContext context,
    WidgetRef ref,
    Medicine medicine,
  ) async {
    try {
      await ref.read(cartProvider.notifier).add(medicine.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${medicine.displayName} به سبد خرید افزوده شد.'),
            action: SnackBarAction(
              label: 'مشاهده سبد',
              onPressed: () => context.go('/cart'),
            ),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const query = CatalogueQuery();
    final medicines = ref.watch(medicinesProvider(query));
    final categories = ref.watch(categoriesProvider);
    final addresses = ref.watch(addressesProvider);

    return MainScaffold(
      index: 2,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'اعلان‌ها',
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('اعلان‌ها در نسخه بعدی فعال می‌شود.'),
              ),
            ),
            icon: const Badge(
              smallSize: 8,
              child: Icon(Icons.notifications_none_rounded),
            ),
          ),
          title: const DarmaltonWordmark(height: 36),
          actions: [
            IconButton(
              tooltip: DariStrings.categories,
              onPressed: () => context.go('/categories'),
              icon: const Icon(Icons.menu_rounded),
            ),
            const SizedBox(width: 4),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(medicinesProvider(query));
            ref.invalidate(categoriesProvider);
            ref.invalidate(addressesProvider);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                sliver: SliverToBoxAdapter(
                  child: _AddressBar(addresses: addresses),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: TextField(
                    readOnly: true,
                    onTap: () => context.push('/search'),
                    decoration: const InputDecoration(
                      hintText: DariStrings.searchHint,
                      prefixIcon: Icon(Icons.search_rounded),
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: _PromotionBanner(onTap: () => context.push('/search')),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: SectionTitle(
                    title: 'دسته‌بندی‌ها',
                    action: DariStrings.seeAll,
                    onAction: () => context.go('/categories'),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 132,
                  child: categories.when(
                    loading: () => ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (_, _) =>
                          const SkeletonBox(height: 124, width: 112),
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemCount: 4,
                    ),
                    error: (error, _) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: AsyncMessage(
                        message: '$error',
                        onRetry: () => ref.invalidate(categoriesProvider),
                      ),
                    ),
                    data: (items) => ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: items.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemBuilder: (_, index) => SizedBox(
                        width: 112,
                        child: CategoryTile(
                          category: items[index],
                          compact: true,
                          onTap: () => context.push(
                            '/search?category=${items[index].slug}',
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 22, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: SectionTitle(
                    title: 'پیشنهادهای درملتون',
                    action: DariStrings.seeAll,
                    onAction: () => context.push('/search'),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 300,
                  child: medicines.when(
                    loading: () => ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (_, _) =>
                          const SkeletonBox(height: 290, width: 188),
                      separatorBuilder: (_, _) => const SizedBox(width: 12),
                      itemCount: 3,
                    ),
                    error: (error, _) => AsyncMessage(
                      message: '$error',
                      onRetry: () => ref.invalidate(medicinesProvider(query)),
                    ),
                    data: (items) => items.isEmpty
                        ? const EmptyMessage(
                            'محصولی موجود نیست',
                            'پس از افزودن محصولات، این بخش به‌روز می‌شود.',
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            scrollDirection: Axis.horizontal,
                            itemCount: items.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(width: 12),
                            itemBuilder: (_, index) => CompactMedicineCard(
                              medicine: items[index],
                              onAdd: () =>
                                  _addToCart(context, ref, items[index]),
                            ),
                          ),
                  ),
                ),
              ),
              const SliverPadding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 28),
                sliver: SliverToBoxAdapter(child: _BenefitStrip()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AddressBar extends StatelessWidget {
  const _AddressBar({required this.addresses});

  final AsyncValue<List<Address>> addresses;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(99),
      border: Border.all(color: DarmaltonColors.line),
    ),
    child: Row(
      children: [
        const Icon(
          Icons.location_on_outlined,
          color: DarmaltonColors.teal,
          size: 22,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: addresses.when(
            loading: () => const Text('در حال دریافت آدرس...'),
            error: (_, _) => const Text('آدرس تحویل را در پرداخت انتخاب کنید'),
            data: (items) => Text(
              items.isEmpty
                  ? 'آدرس تحویل را در پرداخت اضافه کنید'
                  : '${items.first.city}، ${items.first.streetAddress}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        const Icon(Icons.keyboard_arrow_down_rounded),
      ],
    ),
  );
}

class _PromotionBanner extends StatelessWidget {
  const _PromotionBanner({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Container(
    height: 190,
    padding: const EdgeInsets.all(22),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFFE9F8F7), Color(0xFFD8F2F0)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
      borderRadius: BorderRadius.circular(DarmaltonRadius.large),
    ),
    child: Stack(
      children: [
        Positioned(
          left: -8,
          bottom: -12,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Transform.rotate(
                angle: -0.14,
                child: const Icon(
                  Icons.medication_rounded,
                  size: 88,
                  color: Color(0xFF53C8C3),
                ),
              ),
              const Icon(
                Icons.local_pharmacy_rounded,
                size: 110,
                color: DarmaltonColors.teal,
              ),
            ],
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: SizedBox(
            width: MediaQuery.sizeOf(context).width * 0.52,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'دواهای مورد نیازتان را آسان پیدا کنید',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                const Text('قیمت و موجودی همیشه از سرور تأیید می‌شود.'),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: onTap,
                  child: const Text('جستجو در محصولات'),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _BenefitStrip extends StatelessWidget {
  const _BenefitStrip();

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    child: const Row(
      children: [
        Expanded(
          child: _Benefit(
            icon: Icons.verified_outlined,
            title: 'محصولات معتبر',
            subtitle: 'کنترل کیفیت',
          ),
        ),
        SizedBox(height: 56, child: VerticalDivider()),
        Expanded(
          child: _Benefit(
            icon: Icons.inventory_2_outlined,
            title: 'موجودی دقیق',
            subtitle: 'تأیید هنگام سفارش',
          ),
        ),
        SizedBox(height: 56, child: VerticalDivider()),
        Expanded(
          child: _Benefit(
            icon: Icons.lock_outline_rounded,
            title: 'پرداخت امن',
            subtitle: 'پرداخت هنگام تحویل',
          ),
        ),
      ],
    ),
  );
}

class _Benefit extends StatelessWidget {
  const _Benefit({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Icon(icon, color: DarmaltonColors.teal, size: 28),
      const SizedBox(height: 6),
      Text(
        title,
        maxLines: 1,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
      ),
      Text(
        subtitle,
        maxLines: 1,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall,
      ),
    ],
  );
}
