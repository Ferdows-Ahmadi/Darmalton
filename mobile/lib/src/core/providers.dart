import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_client.dart';
import 'models.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = AsyncNotifierProvider<AuthController, User?>(
  AuthController.new,
);

class AuthController extends AsyncNotifier<User?> {
  ApiClient get _api => ref.read(apiClientProvider);

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

  Future<void> logout() async {
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

  @override
  Future<Cart> build() async => _load();

  Future<Cart> _load() async {
    final response = await _api.get<Map<String, dynamic>>('/cart/');
    return Cart.fromJson(response.data!);
  }

  Future<void> refresh() async => state = await AsyncValue.guard(_load);

  Future<void> add(String medicineId, {int quantity = 1}) async {
    await _api.post(
      '/cart/items/',
      data: {'medicine_id': medicineId, 'quantity': quantity},
    );
    await refresh();
  }

  Future<void> updateQuantity(CartItem item, int quantity) async {
    await _api.patch('/cart/items/${item.id}/', data: {'quantity': quantity});
    await refresh();
  }

  Future<void> remove(String id) async {
    await _api.delete('/cart/items/$id/');
    await refresh();
  }
}

final addressesProvider = FutureProvider<List<Address>>((ref) async {
  final response = await ref
      .read(apiClientProvider)
      .get<Map<String, dynamic>>('/addresses/');
  return (response.data!['results'] as List<dynamic>)
      .map((item) => Address.fromJson(item as Map<String, dynamic>))
      .toList();
});

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final response = await ref
      .read(apiClientProvider)
      .get<Map<String, dynamic>>('/orders/');
  return (response.data!['results'] as List<dynamic>)
      .map((item) => Order.fromJson(item as Map<String, dynamic>))
      .toList();
});

final orderProvider = FutureProvider.family<Order, String>((ref, id) async {
  final response = await ref
      .read(apiClientProvider)
      .get<Map<String, dynamic>>('/orders/$id/');
  return Order.fromJson(response.data!);
});
