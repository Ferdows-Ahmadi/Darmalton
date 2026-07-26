import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);
    final medicines = ref.watch(medicinesProvider(const CatalogueQuery()));

    return MainScaffold(
      index: 0,
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: DariStrings.search,
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search_rounded),
          ),
          title: const Text('دسته‌بندی‌ها'),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(medicinesProvider(const CatalogueQuery()));
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              TextField(
                readOnly: true,
                onTap: () => context.push('/search'),
                decoration: const InputDecoration(
                  hintText: DariStrings.searchHint,
                  prefixIcon: Icon(Icons.search_rounded),
                ),
              ),
              const SizedBox(height: 16),
              const SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'همه',
                      icon: Icons.grid_view_rounded,
                      selected: true,
                    ),
                    SizedBox(width: 8),
                    _FilterChip(
                      label: 'پرفروش‌ترین',
                      icon: Icons.trending_up_rounded,
                    ),
                    SizedBox(width: 8),
                    _FilterChip(
                      label: 'نسخه‌ای',
                      icon: Icons.receipt_long_outlined,
                    ),
                    SizedBox(width: 8),
                    _FilterChip(
                      label: 'بدون نسخه',
                      icon: Icons.medication_outlined,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              categories.when(
                loading: () => const _CategorySkeleton(),
                error: (error, _) => AsyncMessage(
                  message: '$error',
                  onRetry: () => ref.invalidate(categoriesProvider),
                ),
                data: (items) => GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisExtent: 170,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: items.length,
                  itemBuilder: (_, index) => CategoryTile(
                    category: items[index],
                    onTap: () =>
                        context.push('/search?category=${items[index].slug}'),
                  ),
                ),
              ),
              const SizedBox(height: 28),
              const SectionTitle(title: 'تولیدکنندگان موجود'),
              const SizedBox(height: 10),
              medicines.when(
                loading: () => const SkeletonBox(height: 74),
                error: (_, _) => const SizedBox.shrink(),
                data: (items) {
                  final names =
                      items
                          .map((item) => item.manufacturer)
                          .where((name) => name.isNotEmpty)
                          .toSet()
                          .toList()
                        ..sort();
                  return Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: names
                        .map(
                          (name) => Chip(
                            avatar: const Icon(
                              Icons.factory_outlined,
                              size: 18,
                            ),
                            label: LtrText(name),
                            backgroundColor: Colors.white,
                            side: const BorderSide(color: DarmaltonColors.line),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
              const SizedBox(height: 28),
              const SectionTitle(title: 'پیشنهاد امروز'),
              const SizedBox(height: 10),
              const Row(
                children: [
                  Expanded(
                    child: _CategoryPromo(
                      title: 'ویتامین‌ها و مکمل‌ها',
                      subtitle: 'برای نیازهای روزمره',
                      icon: Icons.health_and_safety_outlined,
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _CategoryPromo(
                      title: 'مراقبت پوست',
                      subtitle: 'محصولات مراقبتی',
                      icon: Icons.spa_outlined,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.icon,
    this.selected = false,
  });

  final String label;
  final IconData icon;
  final bool selected;

  @override
  Widget build(BuildContext context) => Chip(
    avatar: Icon(
      icon,
      size: 18,
      color: selected ? DarmaltonColors.teal : DarmaltonColors.muted,
    ),
    label: Text(label),
    backgroundColor: selected ? DarmaltonColors.mint : Colors.white,
    side: BorderSide(
      color: selected ? DarmaltonColors.teal : DarmaltonColors.line,
    ),
    labelStyle: TextStyle(
      color: selected ? DarmaltonColors.teal : DarmaltonColors.muted,
      fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
    ),
  );
}

class _CategorySkeleton extends StatelessWidget {
  const _CategorySkeleton();

  @override
  Widget build(BuildContext context) => GridView.builder(
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 3,
      mainAxisExtent: 170,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
    ),
    itemCount: 9,
    itemBuilder: (_, _) => const SkeletonBox(height: 170),
  );
}

class _CategoryPromo extends StatelessWidget {
  const _CategoryPromo({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    height: 130,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: DarmaltonColors.mint,
      borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
      border: Border.all(color: DarmaltonColors.mintStrong),
    ),
    child: Stack(
      children: [
        Align(
          alignment: Alignment.bottomLeft,
          child: Icon(icon, size: 58, color: const Color(0xFF6BCDC8)),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ],
    ),
  );
}
