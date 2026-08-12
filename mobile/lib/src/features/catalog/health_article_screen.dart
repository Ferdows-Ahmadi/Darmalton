import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart' hide Text;
import '../../core/design_system.dart';
import '../../core/localized_text.dart';
import '../../core/models.dart';

class HealthArticleScreen extends StatelessWidget {
  const HealthArticleScreen({required this.article, super.key});
  final HealthArticle article;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(article.displayTitle)),
    body: SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 760),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (article.imageUrl.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(DarmaltonRadius.large),
                child: CachedNetworkImage(
                  imageUrl: article.imageUrl,
                  height: 220,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => const _ArticleFallback(),
                ),
              )
            else
              const _ArticleFallback(),
            const SizedBox(height: 24),
            Text(
              article.displayTitle,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            if (article.authorSource.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                article.authorSource,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: DarmaltonColors.tealDark,
                ),
              ),
            ],
            const SizedBox(height: 18),
            Text(
              article.displayBody,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(height: 1.9),
            ),
            const SizedBox(height: 24),
            DarmaltonCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.health_and_safety_outlined,
                    color: DarmaltonColors.teal,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'این مطلب آموزشی است و جای مشوره داکتر یا فارمسست را نمی‌گیرد.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _ArticleFallback extends StatelessWidget {
  const _ArticleFallback();
  @override
  Widget build(BuildContext context) => Container(
    height: 180,
    decoration: BoxDecoration(
        color: DarmaltonColors.mint,
      borderRadius: BorderRadius.circular(DarmaltonRadius.large),
    ),
    alignment: Alignment.center,
    child: const Icon(
      Icons.health_and_safety_outlined,
      size: 58,
      color: DarmaltonColors.teal,
    ),
  );
}
