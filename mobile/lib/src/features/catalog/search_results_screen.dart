import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_settings.dart';
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

enum _SortMode { name, priceLow, priceHigh }

class SearchResultsScreen extends ConsumerStatefulWidget {
  const SearchResultsScreen({
    this.initialCategory = '',
    this.initialQuery = '',
    this.initialManufacturer = '',
    super.key,
  });

  final String initialCategory;
  final String initialQuery;
  final String initialManufacturer;

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  late final _search = TextEditingController(text: widget.initialQuery);
  late String _category = widget.initialCategory;
  _SortMode _sort = _SortMode.name;
  bool _inStockOnly = false;
  bool? _prescriptionFilter;
  late String _manufacturer = widget.initialManufacturer;
  double? _minPrice;
  double? _maxPrice;

  Future<void> _submitSearch(String value) async {
    await ref.read(recentSearchesProvider.notifier).remember(value);
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _add(Medicine medicine) async {
    try {
      await ref.read(cartProvider.notifier).add(medicine);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              DariStrings.t(
                '${medicine.displayName} به سبد افزوده شد.',
                '${medicine.displayName} was added to your cart.',
              ),
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _showFilters(String languageCode) async {
    var stock = _inStockOnly;
    var prescription = _prescriptionFilter;
    var manufacturer = _manufacturer;
    final minPrice = TextEditingController(
      text: _minPrice?.toStringAsFixed(0) ?? '',
    );
    final maxPrice = TextEditingController(
      text: _maxPrice?.toStringAsFixed(0) ?? '',
    );
    double? minimum;
    double? maximum;
    var applyFilters = false;
    final manufacturers = ref.read(manufacturersProvider).value ?? const [];
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              0,
              20,
              MediaQuery.viewInsetsOf(context).bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'فیلتر محصولات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('فقط محصولات موجود'),
                    value: stock,
                    onChanged: (value) => setSheetState(() => stock = value),
                  ),
                  const Text('نیاز به نسخه'),
                  const SizedBox(height: 8),
                  SegmentedButton<bool?>(
                    segments: const [
                      ButtonSegment(value: null, label: Text('همه')),
                      ButtonSegment(value: false, label: Text('بدون نسخه')),
                      ButtonSegment(value: true, label: Text('نسخه‌ای')),
                    ],
                    selected: {prescription},
                    onSelectionChanged: (value) =>
                        setSheetState(() => prescription = value.first),
                  ),
                  if (manufacturers.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: manufacturer,
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: DariStrings.translateForLanguage(
                          languageCode,
                          'تولیدکننده',
                        ),
                        prefixIcon: const Icon(Icons.factory_outlined),
                      ),
                      items: [
                        const DropdownMenuItem(value: '', child: Text('همه')),
                        ...manufacturers.map(
                          (item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(item.name),
                          ),
                        ),
                      ],
                      onChanged: (value) =>
                          setSheetState(() => manufacturer = value ?? ''),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minPrice,
                          keyboardType: TextInputType.number,
                          textDirection: TextDirection.ltr,
                          decoration: InputDecoration(
                            labelText: DariStrings.translateForLanguage(
                              languageCode,
                              'حداقل قیمت',
                            ),
                            suffixText: DariStrings.tForLanguage(
                              languageCode,
                              'افغانی',
                              'AFN',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: maxPrice,
                          keyboardType: TextInputType.number,
                          textDirection: TextDirection.ltr,
                          decoration: InputDecoration(
                            labelText: DariStrings.translateForLanguage(
                              languageCode,
                              'حداکثر قیمت',
                            ),
                            suffixText: DariStrings.tForLanguage(
                              languageCode,
                              'افغانی',
                              'AFN',
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  GradientButton(
                    label: DariStrings.translateForLanguage(
                      languageCode,
                      'اعمال فیلتر',
                    ),
                    icon: Icons.filter_alt_outlined,
                    onPressed: () {
                      final parsedMinimum = minPrice.text.trim().isEmpty
                          ? null
                          : double.tryParse(minPrice.text.trim());
                      final parsedMaximum = maxPrice.text.trim().isEmpty
                          ? null
                          : double.tryParse(maxPrice.text.trim());
                      if ((minPrice.text.trim().isNotEmpty &&
                              parsedMinimum == null) ||
                          (maxPrice.text.trim().isNotEmpty &&
                              parsedMaximum == null) ||
                          (parsedMinimum != null && parsedMinimum < 0) ||
                          (parsedMaximum != null && parsedMaximum < 0) ||
                          (parsedMinimum != null &&
                              parsedMaximum != null &&
                              parsedMinimum > parsedMaximum)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('محدوده قیمت را درست وارد کنید.'),
                          ),
                        );
                        return;
                      }
                      minimum = parsedMinimum;
                      maximum = parsedMaximum;
                      applyFilters = true;
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (applyFilters && mounted) {
      setState(() {
        _inStockOnly = stock;
        _prescriptionFilter = prescription;
        _manufacturer = manufacturer;
        _minPrice = minimum;
        _maxPrice = maximum;
      });
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      minPrice.dispose();
      maxPrice.dispose();
    });
  }

  @override
  Widget build(BuildContext context) {
    final languageCode =
        ref.watch(appSettingsProvider).value?.languageCode ?? 'fa';
    final query = CatalogueQuery(
      search: _search.text.trim(),
      category: _category,
      manufacturer: _manufacturer,
      prescriptionRequired: _prescriptionFilter,
      inStock: _inStockOnly ? true : null,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      ordering: switch (_sort) {
        _SortMode.name => 'name',
        _SortMode.priceLow => 'price',
        _SortMode.priceHigh => '-price',
      },
    );
    final medicines = ref.watch(medicinesProvider(query));
    final categories = ref.watch(categoriesProvider);
    ref.watch(manufacturersProvider);
    final recentSearches = ref.watch(recentSearchesProvider);
    final favorites = ref.watch(favoritesProvider).value ?? const <String>{};

    return Scaffold(
      appBar: AppBar(
        title: Text(DariStrings.tForLanguage(languageCode, 'جستجو', 'Search')),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _search,
              autofocus: widget.initialCategory.isEmpty,
              textInputAction: TextInputAction.search,
              onSubmitted: _submitSearch,
              decoration: InputDecoration(
                hintText: DariStrings.tForLanguage(
                  languageCode,
                  'دنبال دوا، محصول یا دسته‌بندی بگردید...',
                  'Search medicines, products, or categories...',
                ),
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: DariStrings.translateForLanguage(
                          languageCode,
                          'پاک کردن',
                        ),
                        onPressed: () {
                          _search.clear();
                          setState(() {});
                        },
                        icon: const Icon(Icons.close_rounded),
                      ),
              ),
            ),
          ),
          if (_search.text.isEmpty)
            recentSearches.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (items) => items.isEmpty
                  ? const SizedBox.shrink()
                  : SizedBox(
                      height: 42,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        children: [
                          const Padding(
                            padding: EdgeInsetsDirectional.only(
                              end: 8,
                              top: 10,
                            ),
                            child: Text(
                              'جستجوهای اخیر:',
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                          ...items.map(
                            (item) => Padding(
                              padding: const EdgeInsetsDirectional.only(end: 7),
                              child: ActionChip(
                                label: Text(item),
                                onPressed: () {
                                  _search.text = item;
                                  setState(() {});
                                },
                              ),
                            ),
                          ),
                          IconButton(
                            tooltip: 'پاک‌کردن جستجوهای اخیر',
                            onPressed: () => ref
                                .read(recentSearchesProvider.notifier)
                                .clear(),
                            icon: const Icon(Icons.delete_outline_rounded),
                          ),
                        ],
                      ),
                    ),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showFilters(languageCode),
                    icon: const Icon(Icons.filter_alt_outlined),
                    label: const Text('فیلترها'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<_SortMode>(
                    initialValue: _sort,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.swap_vert_rounded),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: _SortMode.name,
                        child: Text('نام محصول'),
                      ),
                      DropdownMenuItem(
                        value: _SortMode.priceLow,
                        child: Text('قیمت: کم به زیاد'),
                      ),
                      DropdownMenuItem(
                        value: _SortMode.priceHigh,
                        child: Text('قیمت: زیاد به کم'),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => _sort = value ?? _SortMode.name),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 46,
            child: categories.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, _) => const SizedBox.shrink(),
              data: (items) => ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                children: [
                  _CategoryChoice(
                    label: 'همه',
                    selected: _category.isEmpty,
                    onTap: () => setState(() => _category = ''),
                  ),
                  ...items.map(
                    (category) => _CategoryChoice(
                      label: category.displayName,
                      selected: _category == category.slug,
                      onTap: () => setState(() => _category = category.slug),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: medicines.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemBuilder: (_, _) => const SkeletonBox(height: 154),
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemCount: 5,
              ),
              error: (error, _) => AsyncMessage(
                message: '$error',
                onRetry: () => ref.invalidate(medicinesProvider(query)),
              ),
              data: (items) {
                final displayed = items;
                if (displayed.isEmpty) {
                  return EmptyMessage(
                    'نتیجه‌ای پیدا نشد',
                    'عبارت کوتاه‌تر یا دسته‌بندی دیگری را امتحان کنید.',
                    icon: Icons.search_off_rounded,
                    actionLabel: 'پاک کردن فیلترها',
                    onAction: () {
                      _search.clear();
                      setState(() {
                        _category = '';
                        _inStockOnly = false;
                        _prescriptionFilter = null;
                        _manufacturer = '';
                        _minPrice = null;
                        _maxPrice = null;
                      });
                    },
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: displayed.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, index) {
                    if (index == 0) {
                      return Text(
                        DariStrings.t(
                          '${displayed.length} نتیجه پیدا شد',
                          '${displayed.length} result(s) found',
                        ),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      );
                    }
                    final medicine = displayed[index - 1];
                    return _SearchMedicineCard(
                      medicine: medicine,
                      onAdd: () => _add(medicine),
                      favorite: favorites.contains(medicine.id),
                      onFavorite: () => ref
                          .read(favoritesProvider.notifier)
                          .toggle(medicine.id),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChoice extends StatelessWidget {
  const _CategoryChoice({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.only(end: 8),
    child: ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: DarmaltonColors.mint,
      side: BorderSide(
        color: selected ? DarmaltonColors.teal : DarmaltonColors.line,
      ),
    ),
  );
}

class _SearchMedicineCard extends StatelessWidget {
  const _SearchMedicineCard({
    required this.medicine,
    required this.onAdd,
    required this.favorite,
    required this.onFavorite,
  });

  final Medicine medicine;
  final VoidCallback onAdd;
  final bool favorite;
  final VoidCallback onFavorite;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: EdgeInsets.zero,
    onTap: () => context.push('/medicines/${medicine.id}'),
    child: SizedBox(
      height: 156,
      child: Row(
        children: [
          SizedBox(
            width: 126,
            child: ClipRRect(
              borderRadius: const BorderRadiusDirectional.horizontal(
                start: Radius.circular(DarmaltonRadius.medium),
              ),
              child: MedicineImage(medicine: medicine),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          medicine.displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      IconButton(
                        tooltip: favorite
                            ? 'حذف از علاقه‌مندی‌ها'
                            : 'افزودن به علاقه‌مندی‌ها',
                        onPressed: onFavorite,
                        icon: Icon(
                          favorite
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          color: favorite ? DarmaltonColors.danger : null,
                        ),
                      ),
                    ],
                  ),
                  LtrText(
                    '${medicine.genericName} · ${medicine.strength}',
                    maxLines: 1,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      Icon(
                        Icons.circle,
                        size: 9,
                        color: medicine.inStock
                            ? DarmaltonColors.success
                            : DarmaltonColors.danger,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        medicine.inStock
                            ? DariStrings.inStock
                            : DariStrings.unavailable,
                        style: TextStyle(
                          color: medicine.inStock
                              ? DarmaltonColors.success
                              : DarmaltonColors.danger,
                          fontSize: 12,
                        ),
                      ),
                      if (medicine.prescriptionRequired) ...[
                        const SizedBox(width: 6),
                        const Text(
                          '· نسخه‌ای',
                          style: TextStyle(
                            color: DarmaltonColors.warning,
                            fontSize: 12,
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        medicine.price == null
                            ? DariStrings.unavailable
                            : '${medicine.price} ${DariStrings.afn}',
                        style: const TextStyle(
                          color: DarmaltonColors.teal,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filledTonal(
                        tooltip: DariStrings.addToCart,
                        onPressed:
                            medicine.inStock && !medicine.prescriptionRequired
                            ? onAdd
                            : null,
                        icon: const Icon(Icons.add_shopping_cart_rounded),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
