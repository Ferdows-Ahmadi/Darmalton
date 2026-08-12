import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/auth_gate.dart';
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';
import '../addresses/address_selector.dart';
import 'promotion_carousel.dart';

class CatalogueScreen extends ConsumerStatefulWidget {
  const CatalogueScreen({super.key});

  @override
  ConsumerState<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends ConsumerState<CatalogueScreen> {
  bool _promptScheduled = false;

  void _scheduleGuestPrompt() {
    if (_promptScheduled) return;
    _promptScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      await ref.read(guestAccountPromptProvider.notifier).markSeen();
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger.showMaterialBanner(
        MaterialBanner(
          leading: const Icon(
            Icons.person_add_alt_1_rounded,
            color: DarmaltonColors.teal,
          ),
          content: const Text(
            'با ایجاد حساب، سبد شما حفظ می‌شود و می‌توانید سفارش و نسخه‌های خود را پیگیری کنید.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                messenger.hideCurrentMaterialBanner();
                context.push(authenticationLocation('login', '/catalogue'));
              },
              child: const Text('ورود'),
            ),
            TextButton(
              onPressed: () {
                messenger.hideCurrentMaterialBanner();
                context.push(authenticationLocation('register', '/catalogue'));
              },
              child: const Text('ایجاد حساب'),
            ),
            TextButton(
              onPressed: messenger.hideCurrentMaterialBanner,
              child: const Text('بعداً'),
            ),
          ],
        ),
      );
    });
  }

  Future<void> _addToCart(
    BuildContext context,
    WidgetRef ref,
    Medicine medicine,
  ) async {
    try {
      await ref.read(cartProvider.notifier).add(medicine);
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
  Widget build(BuildContext context) {
    ref.listen(guestAccountPromptProvider, (_, next) {
      if (next.value == true) _scheduleGuestPrompt();
    });
    const query = CatalogueQuery();
    final medicines = ref.watch(medicinesProvider(query));
    final categories = ref.watch(categoriesProvider);
    final banners = ref.watch(promotionalBannersProvider);
    final recentlyViewed =
        ref.watch(recentlyViewedProvider).value ?? const <String>[];
    final auth = ref.watch(authProvider);
    final AsyncValue<List<Address>> addresses = auth.value == null
        ? const AsyncData([])
        : ref.watch(addressesProvider);
    final selectedAddressId = auth.value == null
        ? null
        : ref.watch(selectedAddressIdProvider).value;

    return MainScaffold(
      index: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const DarmaltonWordmark(height: 36),
          actions: [
            IconButton(
              key: const Key('account-menu-button'),
              tooltip: DariStrings.profile,
              onPressed: () => context.push('/profile'),
              icon: const Icon(Icons.menu_rounded),
            ),
            const SizedBox(width: 4),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(medicinesProvider(query));
            ref.invalidate(categoriesProvider);
            ref.invalidate(promotionalBannersProvider);
            ref.invalidate(addressesProvider);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                sliver: SliverToBoxAdapter(
                  child: _AddressBar(
                    addresses: addresses,
                    selectedAddressId: selectedAddressId,
                    onTap: () => showAddressSelector(context, ref),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: TextField(
                    readOnly: true,
                    onTap: () => context.push('/search'),
                    decoration: InputDecoration(
                      hintText: DariStrings.searchHint,
                      prefixIcon: const Icon(Icons.search_rounded),
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: banners.when(
                    loading: () => const AspectRatio(
                      aspectRatio: 16 / 9,
                      child: SkeletonBox(height: double.infinity),
                    ),
                    error: (error, _) => AsyncMessage(
                      message: '$error',
                      onRetry: () => ref.invalidate(promotionalBannersProvider),
                    ),
                    data: (items) => PromotionCarousel(banners: items),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                sliver: SliverToBoxAdapter(
                  child: _QuickActions(
                    onPrescription: () => context.push('/prescription'),
                  ),
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
                    title: 'دواهای پرطرفدار',
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
                            itemCount: items.take(8).length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(width: 12),
                            itemBuilder: (_, index) => CompactMedicineCard(
                              medicine: items[index],
                              onAdd: items[index].prescriptionRequired
                                  ? null
                                  : () =>
                                        _addToCart(context, ref, items[index]),
                            ),
                          ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: medicines.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, _) => const SizedBox.shrink(),
                  data: (items) => _DiscoverySections(
                    medicines: items,
                    recentlyViewedIds: recentlyViewed,
                    onAdd: (medicine) => _addToCart(context, ref, medicine),
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
  const _AddressBar({
    required this.addresses,
    required this.selectedAddressId,
    required this.onTap,
  });

  final AsyncValue<List<Address>> addresses;
  final String? selectedAddressId;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'انتخاب آدرس تحویل',
    child: Material(
      color: Colors.white,
      shape: StadiumBorder(side: BorderSide(color: DarmaltonColors.line)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
                    error: (_, _) => const Text('انتخاب آدرس تحویل'),
                    data: (items) {
                      final selected = items
                          .where((item) => item.id == selectedAddressId)
                          .firstOrNull;
                      final address =
                          selected ??
                          items.where((item) => item.isDefault).firstOrNull ??
                          items.firstOrNull;
                      return Text(
                        address == null
                            ? 'افزودن آدرس تحویل'
                            : '${address.city}، ${address.streetAddress}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      );
                    },
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onPrescription});

  final VoidCallback onPrescription;

  @override
  Widget build(BuildContext context) => _QuickActionCard(
    icon: Icons.receipt_long_outlined,
    title: 'ارسال نسخه',
    subtitle: 'بررسی امن توسط فارمسست',
    onTap: onPrescription,
  );
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: const EdgeInsets.all(12),
    onTap: onTap,
    child: Row(
      children: [
        CircleAvatar(
          backgroundColor: DarmaltonColors.mint,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(icon),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _DiscoverySections extends StatelessWidget {
  const _DiscoverySections({
    required this.medicines,
    required this.recentlyViewedIds,
    required this.onAdd,
  });

  final List<Medicine> medicines;
  final List<String> recentlyViewedIds;
  final ValueChanged<Medicine> onAdd;

  @override
  Widget build(BuildContext context) {
    final recommended = medicines.skip(4).take(6).toList();
    final today = medicines
        .where((item) => !item.prescriptionRequired)
        .take(4)
        .toList();
    final recentById = {for (final item in medicines) item.id: item};
    final recent = recentlyViewedIds
        .map((id) => recentById[id])
        .whereType<Medicine>()
        .toList();
    final brands =
        medicines
            .map((item) => item.manufacturer)
            .where((name) => name.isNotEmpty && name != 'Not listed')
            .toSet()
            .take(8)
            .toList()
          ..sort();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (recommended.isNotEmpty)
          _MedicineShelf(
            title: 'پیشنهاد برای شما',
            medicines: recommended,
            onAdd: onAdd,
          ),
        if (recent.isNotEmpty)
          _MedicineShelf(
            title: 'ادامه خرید',
            subtitle: 'محصولاتی که اخیراً دیدید',
            medicines: recent,
            onAdd: onAdd,
          ),
        if (today.isNotEmpty) _TodayOffers(medicines: today, onAdd: onAdd),
        if (brands.isNotEmpty) _TopBrands(brands: brands),
        const _SeasonalCampaign(),
        const _HealthArticles(),
      ],
    );
  }
}

class _MedicineShelf extends StatelessWidget {
  const _MedicineShelf({
    required this.title,
    required this.medicines,
    required this.onAdd,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final List<Medicine> medicines;
  final ValueChanged<Medicine> onAdd;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SectionTitle(title: title, action: subtitle),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 300,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: medicines.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, index) {
              final medicine = medicines[index];
              return CompactMedicineCard(
                medicine: medicine,
                onAdd: medicine.prescriptionRequired
                    ? null
                    : () => onAdd(medicine),
              );
            },
          ),
        ),
      ],
    ),
  );
}

class _TodayOffers extends StatelessWidget {
  const _TodayOffers({required this.medicines, required this.onAdd});

  final List<Medicine> medicines;
  final ValueChanged<Medicine> onAdd;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionTitle(
          title: 'پیشنهادهای امروز',
          action: 'قیمت زنده از سرور',
        ),
        const SizedBox(height: 8),
        ...medicines.map(
          (medicine) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: DarmaltonCard(
              padding: const EdgeInsets.all(10),
              onTap: () => context.push('/medicines/${medicine.id}'),
              child: Row(
                children: [
                  SizedBox(
                    width: 74,
                    height: 74,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: MedicineImage(
                        medicine: medicine,
                        padding: const EdgeInsets.all(6),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          medicine.displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${medicine.strength} · ${medicine.displayDosageForm}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          medicine.price == null
                              ? DariStrings.unavailable
                              : '${medicine.price} ${DariStrings.afn}',
                          style: const TextStyle(
                            color: DarmaltonColors.teal,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton.filledTonal(
                    tooltip: DariStrings.addToCart,
                    onPressed: medicine.inStock ? () => onAdd(medicine) : null,
                    icon: const Icon(Icons.add_shopping_cart_rounded),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class _TopBrands extends StatelessWidget {
  const _TopBrands({required this.brands});

  final List<String> brands;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionTitle(title: 'برندهای برتر'),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: brands
              .map(
                (brand) => ActionChip(
                  avatar: const Icon(Icons.verified_outlined, size: 18),
                  label: LtrText(brand),
                  onPressed: () => context.push(
                    '/search?query=${Uri.encodeQueryComponent(brand)}',
                  ),
                ),
              )
              .toList(),
        ),
      ],
    ),
  );
}

class _SeasonalCampaign extends StatelessWidget {
  const _SeasonalCampaign();

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
    child: Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF8E7), Color(0xFFEAF8F6)],
        ),
        borderRadius: BorderRadius.circular(DarmaltonRadius.large),
        border: Border.all(color: DarmaltonColors.line),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 30,
            backgroundColor: Colors.white,
            foregroundColor: DarmaltonColors.teal,
            child: Icon(Icons.air_rounded, size: 32),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'آمادگی برای فصل حساسیت',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Text(
                  'محصولات حساسیت و تنفسی را ببینید؛ برای علایم شدید با داکتر مشوره کنید.',
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'مشاهده محصولات حساسیت',
            onPressed: () => context.push('/search?category=allergy'),
            icon: const Icon(Icons.arrow_back_rounded),
          ),
        ],
      ),
    ),
  );
}

class _HealthArticles extends ConsumerWidget {
  const _HealthArticles();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articles = ref.watch(healthArticlesProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SectionTitle(title: 'مقاله‌های سلامت'),
          const SizedBox(height: 10),
          articles.when(
            data: (items) => items.isEmpty
                ? const DarmaltonCard(
                    child: Text('هنوز مقاله سلامت منتشر نشده است.'),
                  )
                : SizedBox(
                    height: 184,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: items.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 10),
                      itemBuilder: (context, index) {
                        final article = items[index];
                        return SizedBox(
                          width: 252,
                          child: DarmaltonCard(
                            padding: EdgeInsets.zero,
                            onTap: () => context.push(
                              '/health-articles/${article.slug}',
                              extra: article,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(
                                        DarmaltonRadius.medium,
                                      ),
                                    ),
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        if (article.imageUrl.isNotEmpty)
                                          CachedNetworkImage(
                                            imageUrl: article.imageUrl,
                                            fit: BoxFit.cover,
                                            alignment: Alignment.centerRight,
                                            memCacheWidth: 600,
                                            errorWidget: (_, _, _) =>
                                                const SizedBox.shrink(),
                                          )
                                        else
                                          const ColoredBox(
                                            color: DarmaltonColors.mint,
                                          ),
                                        ColoredBox(
                                          color: DarmaltonColors.teal
                                              .withValues(alpha: 0.12),
                                        ),
                                        Center(
                                          child: const Icon(
                                            Icons.health_and_safety_outlined,
                                            size: 40,
                                            color: DarmaltonColors.tealDark,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        article.displayTitle,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      Text(
                                        article.displaySummary,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(
                                          context,
                                        ).textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
            loading: () => const SizedBox(
              height: 184,
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, _) => DarmaltonCard(
              child: Row(
                children: [
                  const Expanded(child: Text('مقاله‌های سلامت دریافت نشد.')),
                  TextButton(
                    onPressed: () => ref.invalidate(healthArticlesProvider),
                    child: const Text('تلاش دوباره'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
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
