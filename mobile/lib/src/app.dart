import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/design_system.dart';
import 'core/auth_gate.dart';
import 'core/app_settings.dart';
import 'core/strings.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/splash_screen.dart';
import 'features/cart/cart_screen.dart';
import 'features/catalog/categories_screen.dart';
import 'features/catalog/catalogue_screen.dart';
import 'features/catalog/medicine_detail_screen.dart';
import 'features/catalog/search_results_screen.dart';
import 'features/checkout/checkout_screen.dart';
import 'features/orders/order_detail_screen.dart';
import 'features/orders/order_history_screen.dart';
import 'features/prescription/prescription_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/settings/account_settings_screen.dart';
import 'features/settings/settings_info_screen.dart';
import 'features/settings/settings_screen.dart';

final routerProvider = Provider<GoRouter>(
  (ref) => GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(
        path: '/login',
        builder: (_, state) =>
            LoginScreen(returnTo: state.uri.queryParameters['returnTo']),
      ),
      GoRoute(
        path: '/register',
        builder: (_, state) =>
            RegisterScreen(returnTo: state.uri.queryParameters['returnTo']),
      ),
      GoRoute(path: '/catalogue', builder: (_, _) => const CatalogueScreen()),
      GoRoute(path: '/categories', builder: (_, _) => const CategoriesScreen()),
      GoRoute(
        path: '/search',
        builder: (_, state) => SearchResultsScreen(
          initialCategory: state.uri.queryParameters['category'] ?? '',
          initialQuery: state.uri.queryParameters['query'] ?? '',
        ),
      ),
      GoRoute(
        path: '/medicines/:id',
        builder: (_, state) =>
            MedicineDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(path: '/cart', builder: (_, _) => const CartScreen()),
      GoRoute(
        path: '/checkout',
        builder: (_, _) => const ProtectedRoute(
          destination: '/checkout',
          child: CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: '/prescription',
        builder: (_, state) => ProtectedRoute(
          destination: '/prescription',
          child: PrescriptionScreen(
            requestedMedicineId: state.uri.queryParameters['medicineId'],
          ),
        ),
      ),
      GoRoute(
        path: '/orders',
        builder: (_, _) => const ProtectedRoute(
          destination: '/orders',
          child: OrderHistoryScreen(),
        ),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) => ProtectedRoute(
          destination: state.uri.toString(),
          child: OrderDetailScreen(id: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, _) => const ProtectedRoute(
          destination: '/profile',
          child: ProfileScreen(),
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (_, _) => const ProtectedRoute(
          destination: '/settings',
          child: SettingsScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/profile',
        builder: (_, _) => const ProtectedRoute(
          destination: '/settings/profile',
          child: ProfileEditScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/security',
        builder: (_, _) => const ProtectedRoute(
          destination: '/settings/security',
          child: SecuritySettingsScreen(),
        ),
      ),
      GoRoute(
        path: '/settings/about',
        builder: (_, _) =>
            const SettingsInfoScreen(kind: SettingsInfoKind.about),
      ),
      GoRoute(
        path: '/settings/terms',
        builder: (_, _) =>
            const SettingsInfoScreen(kind: SettingsInfoKind.terms),
      ),
      GoRoute(
        path: '/settings/privacy',
        builder: (_, _) =>
            const SettingsInfoScreen(kind: SettingsInfoKind.privacy),
      ),
      GoRoute(
        path: '/settings/help',
        builder: (_, _) =>
            const SettingsInfoScreen(kind: SettingsInfoKind.help),
      ),
      GoRoute(
        path: '/settings/contact',
        builder: (_, _) =>
            const SettingsInfoScreen(kind: SettingsInfoKind.contact),
      ),
    ],
  ),
);

class PharmacyApp extends ConsumerWidget {
  const PharmacyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings =
        ref.watch(appSettingsProvider).value ?? const AppSettings();
    return MaterialApp.router(
      title: DariStrings.appName,
      debugShowCheckedModeBanner: false,
      locale: const Locale('fa', 'AF'),
      supportedLocales: const [Locale('fa', 'AF')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: buildDarmaltonTheme(),
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(
            textScaler: TextScaler.linear(settings.largerText ? 1.12 : 1),
            disableAnimations: settings.reduceMotion,
          ),
          child: Directionality(
            textDirection: TextDirection.rtl,
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
      routerConfig: ref.watch(routerProvider),
    );
  }
}
