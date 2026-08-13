import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';
import 'api_endpoint_manager.dart';
import 'app_settings.dart';
import 'google_identity_service.dart';
import 'guest_session.dart';
import 'models.dart';

final apiEndpointManagerProvider = Provider<ApiEndpointManager>((ref) {
  final manager = ApiEndpointManager();
  ref.onDispose(manager.dispose);
  return manager;
});
final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(endpointManager: ref.watch(apiEndpointManagerProvider)),
);
final guestSessionStoreProvider = Provider<GuestSessionStore>(
  (ref) => SecureGuestSessionStore(),
);
final googleIdentityProvider = Provider<GoogleIdentityService>(
  (ref) => PlatformGoogleIdentityService(),
);

final offlineProvider = NotifierProvider<OfflineController, bool>(
  OfflineController.new,
);

final offlineBannerVisibleProvider =
    NotifierProvider<OfflineBannerController, bool>(
      OfflineBannerController.new,
    );

class OfflineBannerController extends Notifier<bool> {
  @override
  bool build() => false;

  void show() => state = true;
  void dismiss() => state = false;
}

class OfflineController extends Notifier<bool> {
  @override
  bool build() => false;

  void markOffline() {
    if (state) return;
    state = true;
    ref.read(offlineBannerVisibleProvider.notifier).show();
  }

  void markOnline() {
    if (!state) return;
    state = false;
    ref.read(offlineBannerVisibleProvider.notifier).dismiss();
  }
}

final authProvider = AsyncNotifierProvider<AuthController, User?>(
  AuthController.new,
);

class AuthController extends AsyncNotifier<User?> {
  ApiClient get _api => ref.read(apiClientProvider);
  GoogleIdentityService get _google => ref.read(googleIdentityProvider);

  @override
  Future<User?> build() async {
    try {
      final response = await _api.get<Map<String, dynamic>>('/auth/me/');
      final user = User.fromJson(response.data!);
      await _applyPreferredLanguage(user);
      return user;
    } on ApiException {
      return null;
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final response = await _api.post<Map<String, dynamic>>(
        '/auth/login/',
        data: {'email': email, 'password': password},
      );
      await _api.saveTokens(response.data!);
      final user = User.fromJson(
        response.data!['user'] as Map<String, dynamic>,
      );
      await _applyPreferredLanguage(user);
      return user;
    });
  }

  Future<void> register(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final response = await _api.post<Map<String, dynamic>>(
        '/auth/register/',
        data: data,
      );
      await _api.saveTokens(response.data!);
      final user = User.fromJson(
        response.data!['user'] as Map<String, dynamic>,
      );
      await _applyPreferredLanguage(user);
      return user;
    });
  }

  Future<void> loginWithGoogle() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final idToken = await _google.authenticate();
      final response = await _api.post<Map<String, dynamic>>(
        '/auth/google/',
        data: {'id_token': idToken},
      );
      await _api.saveTokens(response.data!);
      final user = User.fromJson(
        response.data!['user'] as Map<String, dynamic>,
      );
      await _applyPreferredLanguage(user);
      return user;
    });
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String phone,
  }) async {
    final response = await _api.patch<Map<String, dynamic>>(
      '/auth/me/',
      data: {
        'first_name': firstName.trim(),
        'last_name': lastName.trim(),
        'phone': phone.trim(),
      },
    );
    state = AsyncData(User.fromJson(response.data!));
  }

  Future<void> updatePreferredLanguage(String languageCode) async {
    final current = state.value;
    if (current == null) return;
    final response = await _api.patch<Map<String, dynamic>>(
      '/auth/me/',
      data: {'preferred_language': languageCode == 'en' ? 'en' : 'fa'},
    );
    state = AsyncData(User.fromJson(response.data!));
  }

  Future<void> _applyPreferredLanguage(User user) async {
    final settings = await ref.read(appSettingsProvider.future);
    if (settings.languageCode != user.preferredLanguage) {
      await ref
          .read(appSettingsProvider.notifier)
          .save(settings.copyWith(languageCode: user.preferredLanguage));
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post(
      '/auth/me/change-password/',
      data: {'current_password': currentPassword, 'new_password': newPassword},
    );
  }

  Future<void> deactivateAccount({
    required String currentPassword,
    required String confirmation,
  }) async {
    await _api.post(
      '/auth/me/deactivate/',
      data: {
        'current_password': currentPassword,
        'confirmation': confirmation.trim(),
      },
    );
    final userId = state.value?.id;
    if (userId != null) {
      await ref.read(localCacheProvider).clearPrivateCache(userId);
    }
    await _api.clearTokens();
    await _google.signOut();
    state = const AsyncData(null);
  }

  Future<void> logout() async {
    final userId = state.value?.id;
    if (userId != null) {
      await ref.read(localCacheProvider).clearPrivateCache(userId);
    }
    await _api.clearTokens();
    await _google.signOut();
    state = const AsyncData(null);
  }

  Future<void> sessionExpired() async {
    final userId = state.value?.id;
    if (userId != null) {
      await ref.read(localCacheProvider).clearPrivateCache(userId);
    }
    await _api.clearTokens();
    state = const AsyncData(null);
  }
}

class CatalogueQuery {
  const CatalogueQuery({
    this.search = '',
    this.category = '',
    this.manufacturer = '',
    this.prescriptionRequired,
    this.inStock,
    this.minPrice,
    this.maxPrice,
    this.ordering = 'name',
  });
  final String search;
  final String category;
  final String manufacturer;
  final bool? prescriptionRequired;
  final bool? inStock;
  final double? minPrice;
  final double? maxPrice;
  final String ordering;

  bool get hasLiveFilters =>
      manufacturer.isNotEmpty ||
      prescriptionRequired != null ||
      inStock != null ||
      minPrice != null ||
      maxPrice != null ||
      ordering != 'name';

  @override
  bool operator ==(Object other) =>
      other is CatalogueQuery &&
      other.search == search &&
      other.category == category &&
      other.manufacturer == manufacturer &&
      other.prescriptionRequired == prescriptionRequired &&
      other.inStock == inStock &&
      other.minPrice == minPrice &&
      other.maxPrice == maxPrice &&
      other.ordering == ordering;

  @override
  int get hashCode => Object.hash(
    search,
    category,
    manufacturer,
    prescriptionRequired,
    inStock,
    minPrice,
    maxPrice,
    ordering,
  );
}

typedef ManufacturerOption = ({
  String id,
  String name,
  String nameDari,
  String logoUrl,
  String countryCode,
});

final manufacturersProvider = FutureProvider<List<ManufacturerOption>>((
  ref,
) async {
  final response = await ref
      .read(apiClientProvider)
      .get<List<dynamic>>('/manufacturers/');
  return response.data!
      .map(
        (item) => (
          id: (item as Map<String, dynamic>)['id'] as String,
          name: item['name'] as String,
          nameDari: item['name_dari'] as String? ?? '',
          logoUrl: item['logo_url'] as String? ?? '',
          countryCode: item['country_code'] as String? ?? '',
        ),
      )
      .toList();
});

final categoriesProvider = StreamProvider<List<Category>>((ref) async* {
  final cache = ref.read(localCacheProvider);
  final cached = await cache.readCategories();
  if (cached.isNotEmpty) yield cached;
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<List<dynamic>>('/categories/');
    final fresh = response.data!
        .map((item) => Category.fromJson(item as Map<String, dynamic>))
        .toList();
    await cache.writeCategories(fresh);
    ref.read(offlineProvider.notifier).markOnline();
    yield fresh;
  } on ApiException {
    ref.read(offlineProvider.notifier).markOffline();
    if (cached.isEmpty) rethrow;
  }
});

final promotionalBannersProvider = StreamProvider<List<PromotionalBanner>>((
  ref,
) async* {
  final cache = ref.read(localCacheProvider);
  final cached = normalizePromotionalBanners(
    await cache.readPromotionalBanners(),
  );
  if (cached.isNotEmpty) yield cached;
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>(
          '/cms/banners/',
          query: {
            'placement': 'HOME_HERO',
            'ordering': 'display_order',
            'page_size': 10,
          },
        );
    final fresh = normalizePromotionalBanners(
      (response.data!['results'] as List<dynamic>).map(
        (item) => PromotionalBanner.fromJson(item as Map<String, dynamic>),
      ),
    );
    await cache.writePromotionalBanners(fresh);
    ref.read(offlineProvider.notifier).markOnline();
    yield fresh;
  } on ApiException {
    ref.read(offlineProvider.notifier).markOffline();
    if (cached.isEmpty) rethrow;
  }
});

final healthArticlesProvider = StreamProvider<List<HealthArticle>>((
  ref,
) async* {
  final cache = ref.read(localCacheProvider);
  final cached = normalizeHealthArticles(await cache.readHealthArticles());
  if (cached.isNotEmpty) yield cached;
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>(
          '/cms/health-articles/',
          query: {'ordering': 'display_order', 'page_size': 12},
        );
    final fresh = normalizeHealthArticles(
      (response.data!['results'] as List<dynamic>).map(
        (item) => HealthArticle.fromJson(item as Map<String, dynamic>),
      ),
    );
    await cache.writeHealthArticles(fresh);
    ref.read(offlineProvider.notifier).markOnline();
    yield fresh;
  } on ApiException {
    ref.read(offlineProvider.notifier).markOffline();
    if (cached.isEmpty) rethrow;
  }
});

final medicinesProvider = StreamProvider.family<List<Medicine>, CatalogueQuery>(
  (ref, query) async* {
    final cache = ref.read(localCacheProvider);
    final cached = await cache.readMedicines(
      search: query.search,
      category: query.category,
    );
    if (cached.isNotEmpty && !query.hasLiveFilters) yield cached;
    try {
      final response = await ref
          .read(apiClientProvider)
          .get<Map<String, dynamic>>(
            '/medicines/',
            query: {
              if (query.search.isNotEmpty) 'search': query.search,
              if (query.category.isNotEmpty) 'category': query.category,
              if (query.manufacturer.isNotEmpty)
                'manufacturer': query.manufacturer,
              if (query.prescriptionRequired != null)
                'prescription_required': query.prescriptionRequired,
              if (query.inStock != null) 'in_stock': query.inStock,
              if (query.minPrice != null) 'min_price': query.minPrice,
              if (query.maxPrice != null) 'max_price': query.maxPrice,
              'ordering': query.ordering,
            },
          );
      final fresh = (response.data!['results'] as List<dynamic>)
          .map((item) => Medicine.fromJson(item as Map<String, dynamic>))
          .toList();
      if (!query.hasLiveFilters) {
        await cache.writeMedicines(
          fresh,
          search: query.search,
          category: query.category,
        );
      }
      ref.read(offlineProvider.notifier).markOnline();
      yield fresh;
    } on ApiException {
      ref.read(offlineProvider.notifier).markOffline();
      if (cached.isEmpty || query.hasLiveFilters) rethrow;
    }
  },
);

final medicineProvider = StreamProvider.family<Medicine, String>((
  ref,
  id,
) async* {
  final cache = ref.read(localCacheProvider);
  final cachedItems = await cache.readMedicines();
  final cached = cachedItems.where((item) => item.id == id).firstOrNull;
  if (cached != null) yield cached;
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/medicines/$id/');
    final fresh = Medicine.fromJson(response.data!);
    final merged = [...cachedItems.where((item) => item.id != id), fresh];
    await cache.writeMedicines(merged);
    ref.read(offlineProvider.notifier).markOnline();
    yield fresh;
  } on ApiException {
    ref.read(offlineProvider.notifier).markOffline();
    if (cached == null) rethrow;
  }
});

final favoritesProvider =
    AsyncNotifierProvider<FavoritesController, Set<String>>(
      FavoritesController.new,
    );

class FavoritesController extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() => ref.read(localCacheProvider).readFavoriteIds();

  Future<void> toggle(String medicineId) async {
    final next = {...?state.value};
    if (!next.add(medicineId)) next.remove(medicineId);
    state = AsyncData(next);
    await ref.read(localCacheProvider).writeFavoriteIds(next);
  }
}

final recentSearchesProvider =
    AsyncNotifierProvider<RecentSearchesController, List<String>>(
      RecentSearchesController.new,
    );

class RecentSearchesController extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() =>
      ref.read(localCacheProvider).readRecentSearches();

  Future<void> remember(String query) async {
    final normalized = query.trim();
    if (normalized.isEmpty) return;
    final settings = ref.read(appSettingsProvider).value;
    if (settings?.rememberSearches == false) return;
    final next = [
      normalized,
      ...?state.value?.where(
        (item) => item.toLowerCase() != normalized.toLowerCase(),
      ),
    ].take(8).toList();
    state = AsyncData(next);
    await ref.read(localCacheProvider).writeRecentSearches(next);
  }

  Future<void> clear() async {
    state = const AsyncData([]);
    await ref.read(localCacheProvider).writeRecentSearches(const []);
  }
}

final recentlyViewedProvider =
    AsyncNotifierProvider<RecentlyViewedController, List<String>>(
      RecentlyViewedController.new,
    );

class RecentlyViewedController extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() =>
      ref.read(localCacheProvider).readRecentlyViewedIds();

  Future<void> remember(String medicineId) async {
    final next = [
      medicineId,
      ...?state.value?.where((id) => id != medicineId),
    ].take(8).toList();
    state = AsyncData(next);
    await ref.read(localCacheProvider).writeRecentlyViewedIds(next);
  }
}

final cartProvider = AsyncNotifierProvider<CartController, Cart>(
  CartController.new,
);

class CartController extends AsyncNotifier<Cart> {
  ApiClient get _api => ref.read(apiClientProvider);
  GuestSessionStore get _guestStore => ref.read(guestSessionStoreProvider);

  @override
  Future<Cart> build() async {
    final user = await ref.watch(authProvider.future);
    if (user == null) return _loadGuest();
    await _synchronizeGuestCart();
    return _loadServer();
  }

  Future<Cart> _loadServer() async {
    try {
      final response = await _api.get<Map<String, dynamic>>('/cart/');
      return Cart.fromJson(response.data!);
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        await ref.read(authProvider.notifier).sessionExpired();
      }
      rethrow;
    }
  }

  Future<Cart> _loadGuest() async {
    final cachedEntries = await _guestStore.loadCart();
    final entries = <GuestCartEntry>[];
    var networkFailed = false;
    for (final entry in cachedEntries) {
      try {
        final response = await _api.get<Map<String, dynamic>>(
          '/medicines/${entry.medicine.id}/',
        );
        entries.add(
          entry.copyWith(medicine: Medicine.fromJson(response.data!)),
        );
      } on ApiException {
        networkFailed = true;
        entries.add(entry);
      }
    }
    if (entries.isNotEmpty) {
      await _guestStore.saveCart(entries);
      if (networkFailed) {
        ref.read(offlineProvider.notifier).markOffline();
      } else {
        ref.read(offlineProvider.notifier).markOnline();
      }
    }
    final items = entries
        .map(
          (entry) => CartItem(
            id: 'guest:${entry.medicine.id}',
            medicine: entry.medicine,
            quantity: entry.quantity,
            availableQuantity: entry.medicine.availableQuantity,
            unitPrice: entry.medicine.price,
            lineTotal: minorUnitsToMoney(
              moneyToMinorUnits(entry.medicine.price) * entry.quantity,
            ),
          ),
        )
        .toList();
    final subtotal = items.fold<int>(
      0,
      (total, item) => total + moneyToMinorUnits(item.lineTotal),
    );
    return Cart(
      id: 'guest',
      items: items,
      subtotal: minorUnitsToMoney(subtotal),
    );
  }

  Future<void> _synchronizeGuestCart() async {
    final entries = [...await _guestStore.loadCart()];
    while (entries.isNotEmpty) {
      final entry = entries.first;
      await _api.post(
        '/cart/items/',
        data: {'medicine_id': entry.medicine.id, 'quantity': entry.quantity},
      );
      entries.removeAt(0);
      await _guestStore.saveCart(entries);
    }
  }

  Future<void> refresh() async {
    final user = ref.read(authProvider).value;
    state = await AsyncValue.guard(user == null ? _loadGuest : _loadServer);
  }

  Future<void> add(
    Medicine medicine, {
    int quantity = 1,
    String? prescriptionId,
  }) async {
    final user = ref.read(authProvider).value;
    if (user == null) {
      final entries = [...await _guestStore.loadCart()];
      final index = entries.indexWhere(
        (entry) => entry.medicine.id == medicine.id,
      );
      if (index == -1) {
        entries.add(GuestCartEntry(medicine: medicine, quantity: quantity));
      } else {
        final updated = entries[index].quantity + quantity;
        entries[index] = entries[index].copyWith(
          quantity: updated.clamp(1, medicine.availableQuantity),
        );
      }
      await _guestStore.saveCart(entries);
    } else {
      final payload = <String, dynamic>{
        'medicine_id': medicine.id,
        'quantity': quantity,
      };
      if (prescriptionId != null) {
        payload['prescription_id'] = prescriptionId;
      }
      await _api.post('/cart/items/', data: payload);
    }
    await refresh();
  }

  Future<void> updateQuantity(CartItem item, int quantity) async {
    final user = ref.read(authProvider).value;
    if (user == null) {
      final entries = [...await _guestStore.loadCart()];
      final index = entries.indexWhere(
        (entry) => entry.medicine.id == item.medicine.id,
      );
      if (index != -1) {
        entries[index] = entries[index].copyWith(quantity: quantity);
        await _guestStore.saveCart(entries);
      }
    } else {
      await _api.patch('/cart/items/${item.id}/', data: {'quantity': quantity});
    }
    await refresh();
  }

  Future<void> remove(String id) async {
    final user = ref.read(authProvider).value;
    if (user == null) {
      final medicineId = id.replaceFirst('guest:', '');
      final entries = [...await _guestStore.loadCart()]
        ..removeWhere((entry) => entry.medicine.id == medicineId);
      await _guestStore.saveCart(entries);
    } else {
      await _api.delete('/cart/items/$id/');
    }
    await refresh();
  }
}

final guestAccountPromptProvider =
    AsyncNotifierProvider<GuestAccountPromptController, bool>(
      GuestAccountPromptController.new,
    );

class GuestAccountPromptController extends AsyncNotifier<bool> {
  GuestSessionStore get _store => ref.read(guestSessionStoreProvider);

  @override
  Future<bool> build() async {
    final user = await ref.watch(authProvider.future);
    if (user != null) return false;
    return !await _store.hasSeenAccountPrompt();
  }

  Future<void> markSeen() async {
    await _store.markAccountPromptSeen();
    state = const AsyncData(false);
  }
}

final addressesProvider = StreamProvider<List<Address>>((ref) async* {
  final user = await ref.watch(authProvider.future);
  if (user == null) {
    yield const [];
    return;
  }
  final cache = ref.read(localCacheProvider);
  final cached = await cache.readAddresses(user.id);
  if (cached.isNotEmpty) yield cached;
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/addresses/');
    final fresh = (response.data!['results'] as List<dynamic>)
        .map((item) => Address.fromJson(item as Map<String, dynamic>))
        .toList();
    await cache.writeAddresses(user.id, fresh);
    final selectedId = await cache.readSelectedAddressId(user.id);
    final selectedStillExists = fresh.any((item) => item.id == selectedId);
    final defaultAddress = fresh.where((item) => item.isDefault).firstOrNull;
    if (!selectedStillExists && defaultAddress != null) {
      await cache.writeSelectedAddressId(user.id, defaultAddress.id);
    }
    ref.read(offlineProvider.notifier).markOnline();
    yield fresh;
  } on ApiException catch (error) {
    if (error.statusCode == 401) {
      await ref.read(authProvider.notifier).sessionExpired();
    }
    ref.read(offlineProvider.notifier).markOffline();
    if (cached.isEmpty) rethrow;
  }
});

final selectedAddressIdProvider = FutureProvider<String?>((ref) async {
  final user = await ref.watch(authProvider.future);
  if (user == null) return null;
  return ref.read(localCacheProvider).readSelectedAddressId(user.id);
});

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/orders/');
    return (response.data!['results'] as List<dynamic>)
        .map((item) => Order.fromJson(item as Map<String, dynamic>))
        .toList();
  } on ApiException catch (error) {
    if (error.statusCode == 401) {
      await ref.read(authProvider.notifier).sessionExpired();
    }
    rethrow;
  }
});

final orderProvider = FutureProvider.family<Order, String>((ref, id) async {
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/orders/$id/');
    return Order.fromJson(response.data!);
  } on ApiException catch (error) {
    if (error.statusCode == 401) {
      await ref.read(authProvider.notifier).sessionExpired();
    }
    rethrow;
  }
});

final prescriptionsProvider = FutureProvider<List<Prescription>>((ref) async {
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/prescriptions/');
    return (response.data!['results'] as List<dynamic>)
        .map((item) => Prescription.fromJson(item as Map<String, dynamic>))
        .toList();
  } on ApiException catch (error) {
    if (error.statusCode == 401) {
      await ref.read(authProvider.notifier).sessionExpired();
    }
    rethrow;
  }
});

final prescriptionRepositoryProvider = Provider<PrescriptionRepositoryBase>(
  (ref) => PrescriptionRepository(ref.read(apiClientProvider)),
);

abstract interface class PrescriptionRepositoryBase {
  Future<Prescription> upload({
    required String filePath,
    required String filename,
    required Map<String, String> fields,
    void Function(int sent, int total)? onProgress,
  });

  Future<void> cancel(String id);

  Future<void> respond(String id, String message);
}

class PrescriptionRepository implements PrescriptionRepositoryBase {
  const PrescriptionRepository(this._api);
  final ApiClient _api;

  @override
  Future<Prescription> upload({
    required String filePath,
    required String filename,
    required Map<String, String> fields,
    void Function(int sent, int total)? onProgress,
  }) async {
    final response = await _api.postFile<Map<String, dynamic>>(
      '/prescriptions/',
      filePath: filePath,
      filename: filename,
      fields: fields,
      onSendProgress: onProgress,
    );
    return Prescription.fromJson(response.data!);
  }

  @override
  Future<void> cancel(String id) async {
    await _api.post('/prescriptions/$id/cancel/', data: const {});
  }

  @override
  Future<void> respond(String id, String message) async {
    await _api.post('/prescriptions/$id/respond/', data: {'response': message});
  }
}
