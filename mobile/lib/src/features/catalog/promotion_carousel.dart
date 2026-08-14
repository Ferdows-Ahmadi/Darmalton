import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';
import '../../core/strings.dart';

String? bannerAppLocation(String value) {
  final uri = Uri.tryParse(value.trim());
  if (uri == null ||
      uri.hasScheme ||
      uri.hasAuthority ||
      !value.startsWith('/') ||
      value.startsWith('//')) {
    return null;
  }
  final path = uri.path;
  if ({
    '/catalogue',
    '/categories',
    '/search',
    '/cart',
    '/prescription',
    '/orders',
    '/profile',
    '/settings',
  }.contains(path)) {
    return uri.toString();
  }
  if (RegExp(r'^/medicines/[^/]+$').hasMatch(path)) return uri.toString();
  return null;
}

class PromotionCarousel extends StatefulWidget {
  const PromotionCarousel({required this.banners, super.key});

  final List<PromotionalBanner> banners;

  @override
  State<PromotionCarousel> createState() => _PromotionCarouselState();
}

class _PromotionCarouselState extends State<PromotionCarousel> {
  static const _interval = Duration(seconds: 6);
  late final PageController _controller;
  Timer? _timer;
  int _page = 0;

  List<PromotionalBanner> get _banners => widget.banners.take(10).toList();

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    _scheduleAutoplay();
  }

  @override
  void didUpdateWidget(covariant PromotionCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_page >= _banners.length) _page = 0;
    _scheduleAutoplay();
  }

  void _scheduleAutoplay() {
    _timer?.cancel();
    if (_banners.length < 2) return;
    _timer = Timer.periodic(_interval, (_) {
      if (!mounted || !_controller.hasClients) return;
      final next = (_page + 1) % _banners.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_banners.isEmpty) return const SizedBox.shrink();
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification &&
                  notification.dragDetails != null) {
                _scheduleAutoplay();
              }
              return false;
            },
            child: PageView.builder(
              key: const Key('cms-promotion-carousel'),
              controller: _controller,
              itemCount: _banners.length,
              physics: _banners.length == 1
                  ? const NeverScrollableScrollPhysics()
                  : const PageScrollPhysics(),
              onPageChanged: (value) => setState(() => _page = value),
              itemBuilder: (_, index) => _BannerImage(
                banner: _banners[index],
                index: index,
                count: _banners.length,
              ),
            ),
          ),
        ),
        if (_banners.length > 1) ...[
          const SizedBox(height: 8),
          Semantics(
            label: 'Banner ${_page + 1} of ${_banners.length}',
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _banners.length,
                (index) => AnimatedContainer(
                  key: Key('banner-dot-$index'),
                  duration: const Duration(milliseconds: 180),
                  width: index == _page ? 18 : 7,
                  height: 7,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    color: index == _page
                        ? DarmaltonColors.teal
                        : DarmaltonColors.line,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _BannerImage extends StatefulWidget {
  const _BannerImage({
    required this.banner,
    required this.index,
    required this.count,
  });

  final PromotionalBanner banner;
  final int index;
  final int count;

  @override
  State<_BannerImage> createState() => _BannerImageState();
}

class _BannerImageState extends State<_BannerImage> {
  static const _loadTimeout = Duration(seconds: 5);

  Timer? _loadTimer;
  int _attempt = 0;
  bool _timedOut = false;

  String get _cacheKey => 'cms-banner-${widget.banner.id}';

  @override
  void initState() {
    super.initState();
    _startLoadTimer();
  }

  @override
  void didUpdateWidget(covariant _BannerImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.banner.id != widget.banner.id ||
        oldWidget.banner.imageUrl != widget.banner.imageUrl) {
      _attempt = 0;
      _startLoadTimer();
    }
  }

  void _startLoadTimer() {
    _loadTimer?.cancel();
    _timedOut = false;
    _loadTimer = Timer(_loadTimeout, () {
      if (mounted) setState(() => _timedOut = true);
    });
  }

  void _finishLoading() {
    _loadTimer?.cancel();
  }

  Future<void> _retry() async {
    await CachedNetworkImage.evictFromCache(
      widget.banner.imageUrl,
      cacheKey: _cacheKey,
    );
    if (!mounted) return;
    setState(() => _attempt += 1);
    _startLoadTimer();
  }

  Widget _fallback() => DecoratedBox(
    key: Key('banner-image-fallback-${widget.banner.id}'),
    decoration: const BoxDecoration(color: DarmaltonColors.mint),
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.image_not_supported_outlined,
            size: 44,
            color: DarmaltonColors.teal,
          ),
          const SizedBox(height: 4),
          TextButton.icon(
            key: Key('banner-image-retry-${widget.banner.id}'),
            onPressed: _retry,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(DariStrings.retry),
          ),
        ],
      ),
    ),
  );

  @override
  void dispose() {
    _loadTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final banner = widget.banner;
    final destination = bannerAppLocation(banner.actionUrl);
    final image = Semantics(
      image: true,
      label: banner.semanticLabel,
      child: _timedOut
          ? _fallback()
          : Image(
              key: ValueKey('banner-image-${banner.id}-$_attempt'),
              image: CachedNetworkImageProvider(
                banner.imageUrl,
                cacheKey: _cacheKey,
                maxWidth: 1920,
              ),
              width: double.infinity,
              height: double.infinity,
              fit: BoxFit.cover,
              frameBuilder: (_, child, frame, wasSynchronouslyLoaded) {
                if (wasSynchronouslyLoaded || frame != null) {
                  _finishLoading();
                  return KeyedSubtree(
                    key: Key('banner-image-rendered-${banner.id}'),
                    child: child,
                  );
                }
                return const DecoratedBox(
                  key: Key('banner-image-loading'),
                  decoration: BoxDecoration(color: DarmaltonColors.mint),
                  child: Center(child: CircularProgressIndicator()),
                );
              },
              errorBuilder: (_, _, _) {
                _finishLoading();
                return _fallback();
              },
            ),
    );
    return Semantics(
      button: destination != null,
      label: '${banner.semanticLabel}. ${widget.index + 1} of ${widget.count}',
      child: Material(
        clipBehavior: Clip.antiAlias,
        borderRadius: BorderRadius.circular(DarmaltonRadius.large),
        child: destination == null
            ? image
            : InkWell(onTap: () => context.push(destination), child: image),
      ),
    );
  }
}
