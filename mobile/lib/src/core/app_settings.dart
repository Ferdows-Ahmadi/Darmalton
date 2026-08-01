import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'local_cache.dart';

class AppSettings {
  const AppSettings({
    this.largerText = false,
    this.reduceMotion = false,
    this.notifications = true,
    this.cacheThumbnails = true,
    this.rememberSearches = true,
    this.languageCode = 'fa',
  });

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
    largerText: json['larger_text'] as bool? ?? false,
    reduceMotion: json['reduce_motion'] as bool? ?? false,
    notifications: json['notifications'] as bool? ?? true,
    cacheThumbnails: json['cache_thumbnails'] as bool? ?? true,
    rememberSearches: json['remember_searches'] as bool? ?? true,
    languageCode: (json['language_code'] as String?) == 'en' ? 'en' : 'fa',
  );

  final bool largerText;
  final bool reduceMotion;
  final bool notifications;
  final bool cacheThumbnails;
  final bool rememberSearches;
  final String languageCode;

  Map<String, dynamic> toJson() => {
    'larger_text': largerText,
    'reduce_motion': reduceMotion,
    'notifications': notifications,
    'cache_thumbnails': cacheThumbnails,
    'remember_searches': rememberSearches,
    'language_code': languageCode,
  };

  AppSettings copyWith({
    bool? largerText,
    bool? reduceMotion,
    bool? notifications,
    bool? cacheThumbnails,
    bool? rememberSearches,
    String? languageCode,
  }) => AppSettings(
    largerText: largerText ?? this.largerText,
    reduceMotion: reduceMotion ?? this.reduceMotion,
    notifications: notifications ?? this.notifications,
    cacheThumbnails: cacheThumbnails ?? this.cacheThumbnails,
    rememberSearches: rememberSearches ?? this.rememberSearches,
    languageCode: languageCode ?? this.languageCode,
  );
}

final localCacheProvider = Provider<LocalCacheStore>(
  (ref) => LocalCacheStore(),
);

final appSettingsProvider =
    AsyncNotifierProvider<AppSettingsController, AppSettings>(
      AppSettingsController.new,
    );

class AppSettingsController extends AsyncNotifier<AppSettings> {
  LocalCacheStore get _cache => ref.read(localCacheProvider);

  @override
  Future<AppSettings> build() async =>
      AppSettings.fromJson(await _cache.readSettings());

  Future<void> save(AppSettings next) async {
    state = AsyncData(next);
    await _cache.writeSettings(next.toJson());
  }

  Future<void> clearPublicCache() => _cache.clearPublicCache();
}
