import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'app_settings.dart';
import 'design_system.dart';
import 'models.dart';
import 'providers.dart';
import 'strings.dart';

class AsyncMessage extends StatelessWidget {
  const AsyncMessage({required this.message, required this.onRetry, super.key});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(DarmaltonSpace.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              color: DarmaltonColors.mint,
              shape: BoxShape.circle,
            ),
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Icon(
                Icons.cloud_off_outlined,
                size: 42,
                color: DarmaltonColors.teal,
              ),
            ),
          ),
          const SizedBox(height: DarmaltonSpace.md),
          const Text(
            'ارتباط با درملتون برقرار نشد',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
          const SizedBox(height: DarmaltonSpace.xs),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: DarmaltonSpace.md),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text(DariStrings.retry),
          ),
        ],
      ),
    ),
  );
}

class EmptyMessage extends StatelessWidget {
  const EmptyMessage(
    this.title,
    this.message, {
    this.icon = Icons.medication_outlined,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String title;
  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(DarmaltonSpace.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 86,
            height: 86,
            decoration: const BoxDecoration(
              color: DarmaltonColors.mint,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 44, color: DarmaltonColors.teal),
          ),
          const SizedBox(height: DarmaltonSpace.md),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: DarmaltonSpace.xs),
          Text(message, textAlign: TextAlign.center),
          if (actionLabel != null) ...[
            const SizedBox(height: DarmaltonSpace.md),
            FilledButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    ),
  );
}

class MainScaffold extends ConsumerStatefulWidget {
  const MainScaffold({required this.child, required this.index, super.key});

  final Widget child;
  final int index;

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  DateTime? _lastBackPress;

  void _handleBack(bool didPop, Object? result) {
    if (didPop) return;
    if (context.canPop()) {
      context.pop();
      return;
    }
    if (widget.index != 2) {
      context.go('/catalogue');
      return;
    }
    final now = DateTime.now();
    if (_lastBackPress != null &&
        now.difference(_lastBackPress!) < const Duration(seconds: 2)) {
      SystemNavigator.pop();
      return;
    }
    _lastBackPress = now;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('برای خروج، دکمه برگشت را دوباره فشار دهید.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final offline = ref.watch(offlineProvider);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: _handleBack,
      child: Scaffold(
        body: Stack(
          children: [
            Positioned.fill(child: widget.child),
            if (offline)
              Positioned(
                top: MediaQuery.paddingOf(context).top + 6,
                left: 14,
                right: 14,
                child: Material(
                  elevation: 3,
                  color: const Color(0xFFFFF4D8),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.cloud_off_outlined,
                          size: 20,
                          color: Color(0xFF9B6813),
                        ),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'آفلاین — قیمت و موجودی تا اتصال دوباره نمایش داده نمی‌شود.',
                            style: TextStyle(
                              color: Color(0xFF79510D),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            ref.invalidate(categoriesProvider);
                            ref.invalidate(
                              medicinesProvider(const CatalogueQuery()),
                            );
                          },
                          child: const Text('تلاش'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: widget.index,
          onDestinationSelected: (value) {
            const routes = [
              '/categories',
              '/orders',
              '/catalogue',
              '/cart',
              '/profile',
            ];
            context.go(routes[value]);
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view_rounded),
              label: DariStrings.categories,
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long_rounded),
              label: DariStrings.orders,
            ),
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: DariStrings.home,
            ),
            NavigationDestination(
              icon: Icon(Icons.shopping_cart_outlined),
              selectedIcon: Icon(Icons.shopping_cart_rounded),
              label: DariStrings.cart,
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: DariStrings.profile,
            ),
          ],
        ),
      ),
    );
  }
}

class DarmaltonWordmark extends StatelessWidget {
  const DarmaltonWordmark({this.height = 34, super.key});

  final double height;

  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/branding/darmalton-wordmark.png',
    height: height,
    fit: BoxFit.contain,
    filterQuality: FilterQuality.high,
    semanticLabel: DariStrings.appName,
  );
}

class GoogleAuthButton extends StatelessWidget {
  const GoogleAuthButton({
    required this.label,
    required this.onPressed,
    this.enabled = true,
    this.loading = false,
    super.key,
  });

  final String label;
  final VoidCallback onPressed;
  final bool enabled;
  final bool loading;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 52,
    child: OutlinedButton(
      key: const Key('google-auth-button'),
      onPressed: enabled && !loading ? onPressed : null,
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF1F1F1F),
        backgroundColor: Colors.white,
        disabledForegroundColor: DarmaltonColors.muted,
        side: const BorderSide(color: Color(0xFF747775)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontFamily: 'Vazirmatn',
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
      child: loading
          ? const SizedBox.square(
              dimension: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/branding/google-g.png',
                  width: 20,
                  height: 20,
                  semanticLabel: 'Google',
                ),
                const SizedBox(width: 12),
                Text(label),
              ],
            ),
    ),
  );
}

class MedicineImage extends StatelessWidget {
  const MedicineImage({
    required this.medicine,
    this.fit = BoxFit.contain,
    this.padding = const EdgeInsets.all(12),
    super.key,
  });

  final Medicine medicine;
  final BoxFit fit;
  final EdgeInsetsGeometry padding;

  bool get _usesFallback {
    if (medicine.imageUrl.isEmpty) return true;
    final uri = Uri.tryParse(medicine.imageUrl);
    return uri?.path.endsWith('/static/medicine-fallback.svg') ?? false;
  }

  Widget _buildImage(bool cacheThumbnails) => Container(
    color: DarmaltonColors.mint,
    padding: padding,
    alignment: Alignment.center,
    child: _usesFallback
        ? const _MedicineFallback()
        : cacheThumbnails
        ? CachedNetworkImage(
            imageUrl: medicine.imageUrl,
            width: double.infinity,
            height: double.infinity,
            fit: fit,
            fadeInDuration: const Duration(milliseconds: 180),
            memCacheWidth: 800,
            maxWidthDiskCache: 1600,
            placeholder: (_, _) => const SkeletonBox(),
            errorWidget: (_, _, _) => const _MedicineFallback(),
          )
        : Image.network(
            medicine.imageUrl,
            width: double.infinity,
            height: double.infinity,
            fit: fit,
            cacheWidth: 800,
            loadingBuilder: (context, child, progress) =>
                progress == null ? child : const SkeletonBox(),
            errorBuilder: (_, _, _) => const _MedicineFallback(),
          ),
  );

  @override
  Widget build(BuildContext context) {
    try {
      ProviderScope.containerOf(context, listen: false);
    } on StateError {
      return _buildImage(true);
    }
    return Consumer(
      builder: (context, ref, _) => _buildImage(
        ref.watch(appSettingsProvider).value?.cacheThumbnails ?? true,
      ),
    );
  }
}

class _MedicineFallback extends StatelessWidget {
  const _MedicineFallback();

  @override
  Widget build(BuildContext context) => const Icon(
    Icons.image_not_supported_outlined,
    size: 64,
    color: DarmaltonColors.teal,
  );
}

class CompactMedicineCard extends StatelessWidget {
  const CompactMedicineCard({
    required this.medicine,
    required this.onAdd,
    this.width = 188,
    super.key,
  });

  final Medicine medicine;
  final VoidCallback? onAdd;
  final double width;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: width,
    child: DarmaltonCard(
      padding: EdgeInsets.zero,
      onTap: () => context.push('/medicines/${medicine.id}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(DarmaltonRadius.medium),
              ),
              child: MedicineImage(medicine: medicine),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medicine.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                LtrText(
                  '${medicine.genericName} · ${medicine.strength}',
                  maxLines: 1,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        medicine.price == null
                            ? DariStrings.unavailable
                            : '${medicine.price} ${DariStrings.afn}',
                        maxLines: 1,
                        style: TextStyle(
                          color: medicine.inStock
                              ? DarmaltonColors.teal
                              : DarmaltonColors.danger,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    IconButton.filledTonal(
                      tooltip: DariStrings.addToCart,
                      onPressed: medicine.inStock ? onAdd : null,
                      icon: const Icon(
                        Icons.add_shopping_cart_rounded,
                        size: 20,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

IconData categoryIcon(String slug) {
  if (slug.contains('vitamin')) return Icons.health_and_safety_outlined;
  if (slug.contains('skin')) return Icons.spa_outlined;
  if (slug.contains('digestive')) return Icons.water_drop_outlined;
  if (slug.contains('respiratory')) return Icons.air_rounded;
  if (slug.contains('heart')) return Icons.favorite_outline;
  if (slug.contains('diabetes')) return Icons.bloodtype_outlined;
  if (slug.contains('allergy')) return Icons.coronavirus_outlined;
  if (slug.contains('antibiotic')) return Icons.medication_liquid_outlined;
  return Icons.medication_outlined;
}

class CategoryTile extends StatelessWidget {
  const CategoryTile({
    required this.category,
    required this.onTap,
    this.compact = false,
    super.key,
  });

  final Category category;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) => DarmaltonCard(
    padding: EdgeInsets.symmetric(
      horizontal: compact ? 12 : 16,
      vertical: compact ? 12 : 20,
    ),
    onTap: onTap,
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: compact ? 48 : 62,
          height: compact ? 48 : 62,
          decoration: const BoxDecoration(
            color: DarmaltonColors.mint,
            shape: BoxShape.circle,
          ),
          child: Icon(
            categoryIcon(category.slug),
            color: DarmaltonColors.teal,
            size: compact ? 26 : 32,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          category.displayName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ],
    ),
  );
}

class SkeletonBox extends StatefulWidget {
  const SkeletonBox({this.height = 120, this.width, super.key});

  final double height;
  final double? width;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 950),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _controller,
    builder: (_, _) => Container(
      height: widget.height,
      width: widget.width,
      decoration: BoxDecoration(
        color: Color.lerp(
          const Color(0xFFF1F4F6),
          DarmaltonColors.mint,
          _controller.value,
        ),
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
      ),
    ),
  );
}
