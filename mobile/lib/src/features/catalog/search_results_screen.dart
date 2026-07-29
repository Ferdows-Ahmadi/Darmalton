import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

enum _SortMode { name, priceLow, priceHigh }

class SearchResultsScreen extends ConsumerStatefulWidget {
  const SearchResultsScreen({this.initialCategory = '', super.key});

  final String initialCategory;

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  final _search = TextEditingController();
  late String _category = widget.initialCategory;
  _SortMode _sort = _SortMode.name;
  bool _inStockOnly = false;
  bool? _prescriptionFilter;

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
          SnackBar(content: Text('${medicine.displayName} به سبد افزوده شد.')),
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

  void _showFilters() {
    var stock = _inStockOnly;
    var prescription = _prescriptionFilter;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
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
                const SizedBox(height: 18),
                GradientButton(
                  label: 'اعمال فیلتر',
                  icon: Icons.filter_alt_outlined,
                  onPressed: () {
                    setState(() {
                      _inStockOnly = stock;
                      _prescriptionFilter = prescription;
                    });
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Medicine> _filtered(List<Medicine> items) {
    final filtered = items.where((medicine) {
      if (_inStockOnly && !medicine.inStock) return false;
      if (_prescriptionFilter != null &&
          medicine.prescriptionRequired != _prescriptionFilter) {
        return false;
      }
      return true;
    }).toList();

    switch (_sort) {
      case _SortMode.name:
        filtered.sort((a, b) => a.displayName.compareTo(b.displayName));
      case _SortMode.priceLow:
        filtered.sort(
          (a, b) => (double.tryParse(a.price ?? '') ?? double.infinity)
              .compareTo(double.tryParse(b.price ?? '') ?? double.infinity),
        );
      case _SortMode.priceHigh:
        filtered.sort(
          (a, b) => (double.tryParse(b.price ?? '') ?? -1).compareTo(
            double.tryParse(a.price ?? '') ?? -1,
          ),
        );
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final query = CatalogueQuery(
      search: _search.text.trim(),
      category: _category,
    );
    final medicines = ref.watch(medicinesProvider(query));
    final categories = ref.watch(categoriesProvider);
    final recentSearches = ref.watch(recentSearchesProvider);
    final favorites = ref.watch(favoritesProvider).value ?? const <String>{};

    return Scaffold(
      appBar: AppBar(title: const Text(DariStrings.search)),
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
                hintText: DariStrings.searchHint,
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'پاک کردن',
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
                    onPressed: _showFilters,
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
                final displayed = _filtered(items);
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
                        '${displayed.length} نتیجه پیدا شد',
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
