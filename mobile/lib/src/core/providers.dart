import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';
import 'google_identity_service.dart';
import 'guest_session.dart';
import 'models.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
final guestSessionStoreProvider = Provider<GuestSessionStore>(
  (ref) => SecureGuestSessionStore(),
);
final googleIdentityProvider = Provider<GoogleIdentityService>(
  (ref) => PlatformGoogleIdentityService(),
);

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
      return User.fromJson(response.data!);
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
      return User.fromJson(response.data!['user'] as Map<String, dynamic>);
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
      return User.fromJson(response.data!['user'] as Map<String, dynamic>);
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
      return User.fromJson(response.data!['user'] as Map<String, dynamic>);
    });
  }

  Future<void> logout() async {
    await _api.clearTokens();
    await _google.signOut();
    state = const AsyncData(null);
  }

  Future<void> sessionExpired() async {
    await _api.clearTokens();
    state = const AsyncData(null);
  }
}

class CatalogueQuery {
  const CatalogueQuery({this.search = '', this.category = ''});
  final String search;
  final String category;

  @override
  bool operator ==(Object other) =>
      other is CatalogueQuery &&
      other.search == search &&
      other.category == category;

  @override
  int get hashCode => Object.hash(search, category);
}

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final response = await ref
      .read(apiClientProvider)
      .get<List<dynamic>>('/categories/');
  return response.data!
      .map((item) => Category.fromJson(item as Map<String, dynamic>))
      .toList();
});

final medicinesProvider = FutureProvider.family<List<Medicine>, CatalogueQuery>(
  (ref, query) async {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>(
          '/medicines/',
          query: {
            if (query.search.isNotEmpty) 'search': query.search,
            if (query.category.isNotEmpty) 'category': query.category,
          },
        );
    return (response.data!['results'] as List<dynamic>)
        .map((item) => Medicine.fromJson(item as Map<String, dynamic>))
        .toList();
  },
);

final medicineProvider = FutureProvider.family<Medicine, String>((
  ref,
  id,
) async {
  final response = await ref
      .read(apiClientProvider)
      .get<Map<String, dynamic>>('/medicines/$id/');
  return Medicine.fromJson(response.data!);
});

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
    final entries = await _guestStore.loadCart();
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

  Future<void> add(Medicine medicine, {int quantity = 1}) async {
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
      await _api.post(
        '/cart/items/',
        data: {'medicine_id': medicine.id, 'quantity': quantity},
      );
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

final addressesProvider = FutureProvider<List<Address>>((ref) async {
  try {
    final response = await ref
        .read(apiClientProvider)
        .get<Map<String, dynamic>>('/addresses/');
    return (response.data!['results'] as List<dynamic>)
        .map((item) => Address.fromJson(item as Map<String, dynamic>))
        .toList();
  } on ApiException catch (error) {
    if (error.statusCode == 401) {
      await ref.read(authProvider.notifier).sessionExpired();
    }
    rethrow;
  }
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
