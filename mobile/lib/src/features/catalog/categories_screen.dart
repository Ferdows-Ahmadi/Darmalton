import 'package:flutter/material.dart' hide Text;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);

    return MainScaffold(
      index: 0,
      child: Scaffold(
        appBar: AppBar(title: const Text('دسته‌بندی‌ها')),
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
                decoration: InputDecoration(
                  hintText: DariStrings.searchHint,
                  prefixIcon: const Icon(Icons.search_rounded),
                ),
              ),
              const SizedBox(height: 20),
              SectionTitle(
                title: 'دسته‌بندی‌ها',
                action: DariStrings.seeAll,
                onAction: () => context.push('/search'),
              ),
              const SizedBox(height: 10),
              categories.when(
                loading: () =>
                    const SizedBox(height: 142, child: _CategorySkeleton()),
                error: (error, _) => AsyncMessage(
                  message: '$error',
                  onRetry: () => ref.invalidate(categoriesProvider),
                ),
                data: (items) => SizedBox(
                  height: 142,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (_, index) => SizedBox(
                      width: 118,
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
              const SizedBox(height: 12),
              categories.when(
                loading: () => const _DiscoverySkeleton(),
                error: (_, _) => const SizedBox.shrink(),
                data: (items) => Column(
                  children: items
                      .take(5)
                      .map((category) => _CategoryDiscovery(category: category))
                      .toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategorySkeleton extends StatelessWidget {
  const _CategorySkeleton();

  @override
  Widget build(BuildContext context) => ListView.separated(
    scrollDirection: Axis.horizontal,
    itemCount: 4,
    separatorBuilder: (_, _) => const SizedBox(width: 10),
    itemBuilder: (_, _) => const SkeletonBox(height: 142, width: 118),
  );
}

class _CategoryDiscovery extends ConsumerWidget {
  const _CategoryDiscovery({required this.category});

  final Category category;

  Future<void> _add(BuildContext context, WidgetRef ref, Medicine item) async {
    try {
      await ref.read(cartProvider.notifier).add(item);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${item.displayName} به سبد افزوده شد.')),
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
    final medicines = ref.watch(
      medicinesProvider(CatalogueQuery(category: category.slug)),
    );
    return medicines.when(
      loading: () => const Padding(
        padding: EdgeInsets.only(top: 18),
        child: SkeletonBox(height: 286),
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SectionTitle(
                title: category.displayName,
                action: DariStrings.seeAll,
                onAction: () =>
                    context.push('/search?category=${category.slug}'),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 286,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: items.take(6).length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (_, index) => CompactMedicineCard(
                    medicine: items[index],
                    width: 180,
                    onAdd: items[index].prescriptionRequired
                        ? null
                        : () => _add(context, ref, items[index]),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DiscoverySkeleton extends StatelessWidget {
  const _DiscoverySkeleton();

  @override
  Widget build(BuildContext context) => const Column(
    children: [
      SizedBox(height: 18),
      SkeletonBox(height: 286),
      SizedBox(height: 18),
      SkeletonBox(height: 286),
    ],
  );
}
