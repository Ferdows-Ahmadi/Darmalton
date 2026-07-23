import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/providers.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/splash_screen.dart';
import 'features/cart/cart_screen.dart';
import 'features/catalog/catalogue_screen.dart';
import 'features/catalog/medicine_detail_screen.dart';
import 'features/checkout/checkout_screen.dart';
import 'features/orders/order_detail_screen.dart';
import 'features/orders/order_history_screen.dart';
import 'features/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) => GoRouter(
      initialLocation: '/splash',
      routes: [
        GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
        GoRoute(path: '/catalogue', builder: (_, __) => const CatalogueScreen()),
        GoRoute(
          path: '/medicines/:id',
          builder: (_, state) => MedicineDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
        GoRoute(path: '/orders', builder: (_, __) => const OrderHistoryScreen()),
        GoRoute(
          path: '/orders/:id',
          builder: (_, state) => OrderDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ));

class PharmacyApp extends ConsumerWidget {
  const PharmacyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
        title: 'Darmalton Pharmacy',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xff0e6f66),
            primary: const Color(0xff0e6f66),
            surface: const Color(0xfff7f5ee),
          ),
          scaffoldBackgroundColor: const Color(0xfff7f5ee),
          useMaterial3: true,
          inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(),
            filled: true,
            fillColor: Colors.white,
          ),
          cardTheme: const CardThemeData(
            color: Colors.white,
            margin: EdgeInsets.zero,
          ),
        ),
        routerConfig: ref.watch(routerProvider),
      );
}
