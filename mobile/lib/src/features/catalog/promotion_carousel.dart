import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/models.dart';

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

class _BannerImage extends StatelessWidget {
  const _BannerImage({
    required this.banner,
    required this.index,
    required this.count,
  });

  final PromotionalBanner banner;
  final int index;
  final int count;

  @override
  Widget build(BuildContext context) {
    final destination = bannerAppLocation(banner.actionUrl);
    final image = Semantics(
      image: true,
      label: banner.semanticLabel,
      child: CachedNetworkImage(
        imageUrl: banner.imageUrl,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        memCacheWidth: 1280,
        maxWidthDiskCache: 1920,
        placeholder: (_, _) => const DecoratedBox(
          decoration: BoxDecoration(color: DarmaltonColors.mint),
          child: Center(child: CircularProgressIndicator()),
        ),
        errorWidget: (_, _, _) => const DecoratedBox(
          decoration: BoxDecoration(color: DarmaltonColors.mint),
          child: Center(
            child: Icon(
              Icons.image_not_supported_outlined,
              size: 52,
              color: DarmaltonColors.teal,
            ),
          ),
        ),
      ),
    );
    return Semantics(
      button: destination != null,
      label: '${banner.semanticLabel}. ${index + 1} of $count',
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
