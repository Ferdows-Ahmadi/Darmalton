import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'models.dart';

const _categoriesKey = 'cache_public_categories_v1';
const _favoritesKey = 'cache_favorite_medicine_ids_v1';
const _recentSearchesKey = 'cache_recent_searches_v1';
const _settingsKey = 'cache_app_settings_v1';

class LocalCacheStore {
  LocalCacheStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  String _medicinesKey(String search, String category) =>
      'cache_public_medicines_v1_${search.trim().toLowerCase()}_${category.trim().toLowerCase()}';

  Future<List<Category>> readCategories() async {
    final decoded = await _readList(_categoriesKey);
    return decoded.map(Category.fromJson).toList();
  }

  Future<void> writeCategories(List<Category> categories) => _writeList(
    _categoriesKey,
    categories.map((item) => item.toJson()).toList(),
  );

  Future<List<Medicine>> readMedicines({
    String search = '',
    String category = '',
  }) async {
    final decoded = await _readList(_medicinesKey(search, category));
    return decoded.map(Medicine.fromJson).toList();
  }

  Future<void> writeMedicines(
    List<Medicine> medicines, {
    String search = '',
    String category = '',
  }) => _writeList(
    _medicinesKey(search, category),
    medicines.map((item) => item.toCacheJson()).toList(),
  );

  Future<Set<String>> readFavoriteIds() async =>
      (await _readStringList(_favoritesKey)).toSet();

  Future<void> writeFavoriteIds(Set<String> ids) =>
      _writeStringList(_favoritesKey, ids.toList()..sort());

  Future<List<String>> readRecentSearches() =>
      _readStringList(_recentSearchesKey);

  Future<void> writeRecentSearches(List<String> searches) =>
      _writeStringList(_recentSearchesKey, searches.take(8).toList());

  Future<Map<String, dynamic>> readSettings() async {
    final raw = await _storage.read(key: _settingsKey);
    if (raw == null || raw.isEmpty) return const {};
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } on FormatException {
      await _storage.delete(key: _settingsKey);
      return const {};
    }
  }

  Future<void> writeSettings(Map<String, dynamic> settings) =>
      _storage.write(key: _settingsKey, value: jsonEncode(settings));

  Future<void> clearPublicCache() async {
    final all = await _storage.readAll();
    for (final key in all.keys.where(
      (key) => key.startsWith('cache_public_'),
    )) {
      await _storage.delete(key: key);
    }
  }

  Future<List<Map<String, dynamic>>> _readList(String key) async {
    final raw = await _storage.read(key: key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      return (jsonDecode(raw) as List<dynamic>).cast<Map<String, dynamic>>();
    } on FormatException {
      await _storage.delete(key: key);
      return const [];
    }
  }

  Future<void> _writeList(String key, List<Map<String, dynamic>> values) =>
      _storage.write(key: key, value: jsonEncode(values));

  Future<List<String>> _readStringList(String key) async {
    final raw = await _storage.read(key: key);
    if (raw == null || raw.isEmpty) return const [];
    try {
      return (jsonDecode(raw) as List<dynamic>).cast<String>();
    } on FormatException {
      await _storage.delete(key: key);
      return const [];
    }
  }

  Future<void> _writeStringList(String key, List<String> values) =>
      _storage.write(key: key, value: jsonEncode(values));
}
