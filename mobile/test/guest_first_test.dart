import 'package:darmalton_pharmacy/src/core/auth_gate.dart';
import 'package:darmalton_pharmacy/src/core/guest_session.dart';
import 'package:darmalton_pharmacy/src/core/models.dart';
import 'package:darmalton_pharmacy/src/core/providers.dart';
import 'package:darmalton_pharmacy/src/features/auth/splash_screen.dart';
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

class FixedAuthController extends AuthController {
  FixedAuthController(this.user);

  final User? user;

  @override
  Future<User?> build() async => user;
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
