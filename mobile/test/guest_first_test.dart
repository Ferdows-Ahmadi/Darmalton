import 'package:darmalton_pharmacy/src/core/auth_gate.dart';
import 'package:darmalton_pharmacy/src/core/guest_session.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/core/providers.dart';
import 'package:darmalton_pharmacy/src/features/auth/splash_screen.dart';
import 'package:darmalton_pharmacy/src/features/auth/login_screen.dart';
import 'package:darmalton_pharmacy/src/features/auth/register_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

const authenticatedUser = User(
  id: 'user-id',
  email: 'customer@example.test',
  firstName: 'Customer',
  lastName: 'Test',
  role: 'CUSTOMER',
);

const authenticatedAdmin = User(
  id: 'admin-id',
  email: 'admin@example.test',
  firstName: 'Admin',
  lastName: 'Test',
  role: 'ADMIN',
);

class FixedAuthController extends AuthController {
  FixedAuthController(this.user);

  final User? user;

  @override
  Future<User?> build() async => user;
}

class SuccessfulAuthController extends AuthController {
  SuccessfulAuthController(this.result);

  final User result;

  @override
  Future<User?> build() async => null;

  @override
  Future<void> login(String email, String password) async {
    state = AsyncData(result);
  }

  @override
  Future<void> register(Map<String, dynamic> data) async {
    state = AsyncData(result);
  }
}

class MemoryGuestSessionStore implements GuestSessionStore {
  bool promptSeen = false;
  List<GuestCartEntry> entries = [];

  @override
  Future<bool> hasSeenAccountPrompt() async => promptSeen;

  @override
  Future<List<GuestCartEntry>> loadCart() async => [...entries];

  @override
  Future<void> markAccountPromptSeen() async => promptSeen = true;

  @override
  Future<void> saveCart(List<GuestCartEntry> entries) async {
    this.entries = [...entries];
  }
}

Widget splashHarness(User? user) {
  final router = GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(
        path: '/catalogue',
        builder: (_, _) => const Scaffold(body: Text('خانه عمومی')),
      ),
    ],
  );
  return ProviderScope(
    overrides: [authProvider.overrideWith(() => FixedAuthController(user))],
    child: MaterialApp.router(routerConfig: router),
  );
}

Widget authenticationHarness({
  required User result,
  required String initialLocation,
}) {
  final router = GoRouter(
    initialLocation: initialLocation,
    routes: [
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
      GoRoute(
        path: '/catalogue',
        builder: (_, _) => const Scaffold(body: Text('HOME_DESTINATION')),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, _) => const Scaffold(body: Text('PROFILE_DESTINATION')),
      ),
      GoRoute(
        path: '/checkout',
        builder: (_, _) => const Scaffold(body: Text('CHECKOUT_DESTINATION')),
      ),
    ],
  );
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => SuccessfulAuthController(result)),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

Future<void> submitLogin(WidgetTester tester) async {
  await tester.enterText(
    find.byType(TextFormField).at(0),
    'person@example.test',
  );
  await tester.enterText(find.byType(TextFormField).at(1), 'ValidPass123!');
  await tester.tap(find.text('ورود').last);
  await tester.pumpAndSettle();
}

void main() {
  test('return destinations reject external and authentication loops', () {
    expect(
      safeReturnLocation('/checkout?step=address'),
      '/checkout?step=address',
    );
    expect(safeReturnLocation('https://attacker.test'), '/catalogue');
    expect(safeReturnLocation('//attacker.test/path'), '/catalogue');
    expect(safeReturnLocation('/login'), '/catalogue');
    expect(
      authenticationLocation('login', '/orders'),
      '/login?returnTo=%2Forders',
    );
  });

  testWidgets('unauthenticated startup opens the public home', (tester) async {
    await tester.pumpWidget(splashHarness(null));
    await tester.pumpAndSettle();
    expect(find.text('خانه عمومی'), findsOneWidget);
    expect(find.byType(SplashScreen), findsNothing);
  });

  testWidgets('authenticated startup also opens the public home', (
    tester,
  ) async {
    await tester.pumpWidget(splashHarness(authenticatedUser));
    await tester.pumpAndSettle();
    expect(find.text('خانه عمومی'), findsOneWidget);
  });

  testWidgets('normal customer login always opens Home', (tester) async {
    await tester.pumpWidget(
      authenticationHarness(
        result: authenticatedUser,
        initialLocation: '/login',
      ),
    );
    await tester.pumpAndSettle();
    await submitLogin(tester);
    expect(find.text('HOME_DESTINATION'), findsOneWidget);
    expect(find.text('PROFILE_DESTINATION'), findsNothing);
  });

  testWidgets('normal staff login in the customer app also opens Home', (
    tester,
  ) async {
    await tester.pumpWidget(
      authenticationHarness(
        result: authenticatedAdmin,
        initialLocation: '/login',
      ),
    );
    await tester.pumpAndSettle();
    await submitLogin(tester);
    expect(find.text('HOME_DESTINATION'), findsOneWidget);
    expect(find.text('PROFILE_DESTINATION'), findsNothing);
  });

  testWidgets('login prompted by a protected route preserves that route', (
    tester,
  ) async {
    await tester.pumpWidget(
      authenticationHarness(
        result: authenticatedUser,
        initialLocation: '/login?returnTo=%2Fcheckout',
      ),
    );
    await tester.pumpAndSettle();
    await submitLogin(tester);
    expect(find.text('CHECKOUT_DESTINATION'), findsOneWidget);
  });

  testWidgets('normal registration opens Home', (tester) async {
    await tester.pumpWidget(
      authenticationHarness(
        result: authenticatedUser,
        initialLocation: '/register',
      ),
    );
    await tester.pumpAndSettle();
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'Customer');
    await tester.enterText(fields.at(1), 'Test');
    await tester.enterText(fields.at(2), 'customer@example.test');
    await tester.enterText(fields.at(4), 'ValidPass123!');
    await tester.tap(find.byIcon(Icons.person_add_alt_1_rounded));
    await tester.pumpAndSettle();
    expect(find.text('HOME_DESTINATION'), findsOneWidget);
  });

  testWidgets('protected action explains authentication and preserves intent', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authProvider.overrideWith(() => FixedAuthController(null))],
        child: const MaterialApp(
          home: ProtectedRoute(
            destination: '/checkout',
            child: Scaffold(body: Text('پرداخت خصوصی')),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('برای ادامه وارد حساب شوید'), findsOneWidget);
    expect(find.text('پرداخت خصوصی'), findsNothing);
    expect(find.text('ورود'), findsOneWidget);
    expect(find.text('ایجاد حساب'), findsOneWidget);
  });

  test('first-time prompt is persisted and appears once', () async {
    final store = MemoryGuestSessionStore();
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(() => FixedAuthController(null)),
        guestSessionStoreProvider.overrideWithValue(store),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(guestAccountPromptProvider.future), isTrue);
    await container.read(guestAccountPromptProvider.notifier).markSeen();
    expect(container.read(guestAccountPromptProvider).value, isFalse);

    container.invalidate(guestAccountPromptProvider);
    expect(await container.read(guestAccountPromptProvider.future), isFalse);
  });

  test('first-time prompt is suppressed for authenticated users', () async {
    final store = MemoryGuestSessionStore();
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(() => FixedAuthController(authenticatedUser)),
        guestSessionStoreProvider.overrideWithValue(store),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(guestAccountPromptProvider.future), isFalse);
    expect(store.promptSeen, isFalse);
  });

  test('guest money calculations stay exact in minor units', () {
    expect(moneyToMinorUnits('120.50'), 12050);
    expect(minorUnitsToMoney(12050 * 3), '361.50');
  });
}
