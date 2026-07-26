import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class CatalogueScreen extends ConsumerStatefulWidget {
  const CatalogueScreen({super.key});

  @override
  ConsumerState<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends ConsumerState<CatalogueScreen> {
  final _search = TextEditingController();
  String _category = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = CatalogueQuery(
      search: _search.text.trim(),
      category: _category,
    );
    final medicines = ref.watch(medicinesProvider(query));
    final categories = ref.watch(categoriesProvider);
    return MainScaffold(
      index: 0,
      child: Scaffold(
        appBar: AppBar(title: const Text('Darmalton Pharmacy')),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(medicinesProvider(query));
            ref.invalidate(categoriesProvider);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Find your medicine',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _search,
                        textInputAction: TextInputAction.search,
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.search),
                          hintText: 'Brand or generic name',
                        ),
                        onSubmitted: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      categories.when(
                        data: (items) => DropdownButtonFormField<String>(
                          initialValue: _category,
                          decoration: const InputDecoration(
                            labelText: 'Category',
                          ),
                          items: [
                            const DropdownMenuItem(
                              value: '',
                              child: Text('All categories'),
                            ),
                            ...items.map(
                              (item) => DropdownMenuItem(
                                value: item.slug,
                                child: Text(item.name),
                              ),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _category = value ?? ''),
                        ),
                        loading: () => const LinearProgressIndicator(),
                        error: (_, _) => const Text('Categories unavailable'),
                      ),
                    ],
                  ),
                ),
              ),
              medicines.when(
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, _) => SliverFillRemaining(
                  child: AsyncMessage(
                    message: '$error',
                    onRetry: () => ref.invalidate(medicinesProvider(query)),
                  ),
                ),
                data: (items) => items.isEmpty
                    ? const SliverFillRemaining(
                        child: EmptyMessage(
                          'No medicines found',
                          'Try a broader search or another category.',
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        sliver: SliverGrid.builder(
                          gridDelegate:
                              const SliverGridDelegateWithMaxCrossAxisExtent(
                                maxCrossAxisExtent: 260,
                                mainAxisExtent: 236,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                          itemCount: items.length,
                          itemBuilder: (_, index) =>
                              _MedicineCard(items[index]),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MedicineCard extends StatelessWidget {
  const _MedicineCard(this.medicine);
  final Medicine medicine;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: () => context.push('/medicines/${medicine.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              color: const Color(0xffd9eee8),
              child: medicine.imageUrl.isEmpty
                  ? const Icon(Icons.medication, size: 60)
                  : Image.network(
                      medicine.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          const Icon(Icons.medication, size: 60),
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medicine.brandName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  '${medicine.genericName} · ${medicine.strength}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  medicine.price == null
                      ? 'Unavailable'
                      : '${medicine.price} AFN',
                  style: TextStyle(
                    color: medicine.inStock
                        ? const Color(0xff0e6f66)
                        : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
