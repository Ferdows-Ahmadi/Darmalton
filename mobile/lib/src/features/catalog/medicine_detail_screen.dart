import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/providers.dart';
import '../../core/strings.dart';
import '../../core/widgets.dart';

class MedicineDetailScreen extends ConsumerWidget {
  const MedicineDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medicine = ref.watch(medicineProvider(id));
    return MainScaffold(
      index: 2,
      child: medicine.when(
        loading: () => const Scaffold(
          appBar: _DetailAppBar(),
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (error, _) => Scaffold(
          appBar: const _DetailAppBar(),
          body: AsyncMessage(
            message: '$error',
            onRetry: () => ref.invalidate(medicineProvider(id)),
          ),
        ),
        data: (item) => _MedicineDetail(medicine: item),
      ),
    );
  }
}

class _DetailAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _DetailAppBar();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) => AppBar(
    title: const DarmaltonWordmark(height: 32),
    actions: [
      IconButton(
        tooltip: 'اشتراک‌گذاری',
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('اشتراک‌گذاری در نسخه بعدی فعال می‌شود.'),
          ),
        ),
        icon: const Icon(Icons.share_outlined),
      ),
      IconButton(
        tooltip: 'ذخیره محصول',
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ذخیره محصولات در نسخه بعدی فعال می‌شود.'),
          ),
        ),
        icon: const Icon(Icons.favorite_border_rounded),
      ),
    ],
  );
}

class _MedicineDetail extends ConsumerStatefulWidget {
  const _MedicineDetail({required this.medicine});

  final Medicine medicine;

  @override
  ConsumerState<_MedicineDetail> createState() => _MedicineDetailState();
}

class _MedicineDetailState extends ConsumerState<_MedicineDetail> {
  int _quantity = 1;
  bool _adding = false;

  Medicine get medicine => widget.medicine;
  bool get canOrder => medicine.inStock && !medicine.prescriptionRequired;

  Future<void> _add({bool checkout = false}) async {
    if (!canOrder) {
      if (medicine.prescriptionRequired) {
        context.push('/prescription');
      }
      return;
    }
    setState(() => _adding = true);
    try {
      await ref
          .read(cartProvider.notifier)
          .add(medicine.id, quantity: _quantity);
      if (!mounted) return;
      if (checkout) {
        context.push('/checkout');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${medicine.displayName} به سبد افزوده شد.'),
            action: SnackBarAction(
              label: 'مشاهده سبد',
              onPressed: () => context.go('/cart'),
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
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const _DetailAppBar(),
    body: CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _ImageGallery(medicine: medicine),
                const SizedBox(height: 20),
                Text(
                  medicine.displayName,
                  textAlign: TextAlign.start,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 2),
                LtrText(
                  '${medicine.brandName} · ${medicine.genericName} ${medicine.strength}',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: DarmaltonColors.muted),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    StatusChip(
                      label: medicine.inStock
                          ? DariStrings.inStock
                          : DariStrings.unavailable,
                      icon: medicine.inStock
                          ? Icons.check_circle_outline
                          : Icons.cancel_outlined,
                      color: medicine.inStock
                          ? DarmaltonColors.success
                          : DarmaltonColors.danger,
                    ),
                    if (medicine.prescriptionRequired)
                      const StatusChip(
                        label: 'نیاز به نسخه',
                        icon: Icons.receipt_long_outlined,
                        color: DarmaltonColors.warning,
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                _Facts(medicine: medicine),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        medicine.price == null
                            ? DariStrings.unavailable
                            : '${medicine.price} ${DariStrings.afn}',
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(color: DarmaltonColors.teal),
                      ),
                    ),
                    if (medicine.inStock)
                      Text(
                        '${medicine.availableQuantity} عدد موجود',
                        style: const TextStyle(color: DarmaltonColors.success),
                      ),
                  ],
                ),
                const SizedBox(height: 22),
                const _SectionHeading('توضیحات'),
                Text(medicine.displayDescription),
                const SizedBox(height: 18),
                const Divider(),
                const _SectionHeading('روش مصرف'),
                const Text(
                  'روش مصرف باید مطابق نسخه یا راهنمای تأییدشده محصول باشد. '
                  'برای معلومات شخصی با داکتر یا فارمسست مشوره کنید.',
                ),
                const SizedBox(height: 14),
                ExpansionTile(
                  tilePadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.science_outlined,
                    color: DarmaltonColors.teal,
                  ),
                  title: const Text('ترکیبات'),
                  subtitle: const Text('معلومات ثبت نشده'),
                  children: const [
                    Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: Text(
                        'ترکیبات این محصول در کاتالوگ نمایشی ثبت نشده است.',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const _PharmacistNote(),
                const SizedBox(height: 18),
                Row(
                  children: [
                    const Text(
                      'تعداد',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 16),
                    _QuantitySelector(
                      quantity: _quantity,
                      max: medicine.availableQuantity,
                      onChanged: (value) => setState(() => _quantity = value),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    ),
    bottomNavigationBar: SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: medicine.prescriptionRequired
          ? GradientButton(
              label: 'ارسال نسخه برای بررسی',
              icon: Icons.upload_file_rounded,
              onPressed: () => context.push('/prescription'),
            )
          : Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: canOrder && !_adding
                        ? () => _add(checkout: true)
                        : null,
                    icon: const Icon(Icons.bolt_rounded),
                    label: const Text('خرید فوری'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GradientButton(
                    label: medicine.inStock
                        ? DariStrings.addToCart
                        : DariStrings.unavailable,
                    icon: Icons.shopping_cart_outlined,
                    onPressed: canOrder ? _add : null,
                    loading: _adding,
                  ),
                ),
              ],
            ),
    ),
  );
}

class _ImageGallery extends StatelessWidget {
  const _ImageGallery({required this.medicine});

  final Medicine medicine;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(DarmaltonRadius.large),
        child: SizedBox(
          height: 300,
          width: double.infinity,
          child: MedicineImage(
            medicine: medicine,
            padding: const EdgeInsets.all(32),
          ),
        ),
      ),
      const SizedBox(height: 10),
      SizedBox(
        width: 86,
        height: 70,
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(DarmaltonRadius.small),
            border: Border.all(color: DarmaltonColors.teal, width: 1.5),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(DarmaltonRadius.small - 1),
            child: MedicineImage(
              medicine: medicine,
              padding: const EdgeInsets.all(8),
            ),
          ),
        ),
      ),
    ],
  );
}

class _Facts extends StatelessWidget {
  const _Facts({required this.medicine});

  final Medicine medicine;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
    child: Row(
      children: [
        Expanded(
          child: _Fact(
            icon: Icons.medication_outlined,
            title: 'نوع محصول',
            value: medicine.displayDosageForm,
          ),
        ),
        const SizedBox(height: 58, child: VerticalDivider()),
        Expanded(
          child: _Fact(
            icon: Icons.science_outlined,
            title: 'قدرت',
            value: medicine.strength,
            ltr: true,
          ),
        ),
        const SizedBox(height: 58, child: VerticalDivider()),
        Expanded(
          child: _Fact(
            icon: Icons.inventory_2_outlined,
            title: 'بسته‌بندی',
            value: medicine.packSize.isEmpty ? 'ثبت نشده' : medicine.packSize,
          ),
        ),
      ],
    ),
  );
}

class _Fact extends StatelessWidget {
  const _Fact({
    required this.icon,
    required this.title,
    required this.value,
    this.ltr = false,
  });

  final IconData icon;
  final String title;
  final String value;
  final bool ltr;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Icon(icon, color: DarmaltonColors.teal),
      const SizedBox(height: 5),
      Text(title, style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 2),
      if (ltr)
        LtrText(
          value,
          textAlign: TextAlign.center,
          style: const TextStyle(fontWeight: FontWeight.w600),
        )
      else
        Text(
          value,
          maxLines: 2,
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        ),
    ],
  );
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(this.title);

  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _PharmacistNote extends StatelessWidget {
  const _PharmacistNote();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: DarmaltonColors.mint,
      borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
    ),
    child: const Row(
      children: [
        CircleAvatar(
          backgroundColor: Colors.white,
          foregroundColor: DarmaltonColors.teal,
          child: Icon(Icons.support_agent_rounded),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'یادداشت فارمسست',
                style: TextStyle(
                  color: DarmaltonColors.teal,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                'در صورت حساسیت، بارداری یا مصرف دوای دیگر، پیش از خرید مشوره بگیرید.',
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _QuantitySelector extends StatelessWidget {
  const _QuantitySelector({
    required this.quantity,
    required this.max,
    required this.onChanged,
  });

  final int quantity;
  final int max;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      border: Border.all(color: DarmaltonColors.teal),
      borderRadius: BorderRadius.circular(DarmaltonRadius.small),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: quantity > 1 ? () => onChanged(quantity - 1) : null,
          icon: const Icon(Icons.remove_rounded),
        ),
        SizedBox(
          width: 32,
          child: Text(
            '$quantity',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        IconButton(
          onPressed: quantity < max ? () => onChanged(quantity + 1) : null,
          icon: const Icon(Icons.add_rounded),
        ),
      ],
    ),
  );
}
