import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/design_system.dart';
import '../../core/providers.dart';
import '../../core/widgets.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(authProvider, (_, next) {
      next.whenData((_) => context.go('/catalogue'));
    });
    return const Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white, DarmaltonColors.mint],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DarmaltonWordmark(height: 72),
              SizedBox(height: 20),
              Text(
                'داروخانه آنلاین شما',
                style: TextStyle(color: DarmaltonColors.muted, fontSize: 16),
              ),
              SizedBox(height: 28),
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
