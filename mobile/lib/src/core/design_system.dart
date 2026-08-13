import 'package:flutter/material.dart' hide Text;

import 'localized_text.dart';

abstract final class DarmaltonColors {
  static const teal = Color(0xFF079C9A);
  static const tealDark = Color(0xFF087F7E);
  static const mint = Color(0xFFE7F6F5);
  static const mintStrong = Color(0xFFD1EFED);
  static const ink = Color(0xFF101828);
  static const muted = Color(0xFF667085);
  static const line = Color(0xFFE4E9EC);
  static const canvas = Color(0xFFFBFDFD);
  static const success = Color(0xFF18A957);
  static const warning = Color(0xFFF5A700);
  static const danger = Color(0xFFE84655);

  static const primaryGradient = LinearGradient(
    colors: [Color(0xFF08A6A2), Color(0xFF087F7E)],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );
}

abstract final class DarmaltonSpace {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

abstract final class DarmaltonRadius {
  static const small = 12.0;
  static const medium = 18.0;
  static const large = 24.0;
}

ThemeData buildDarmaltonTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: DarmaltonColors.teal,
    brightness: Brightness.light,
    primary: DarmaltonColors.teal,
    surface: Colors.white,
    error: DarmaltonColors.danger,
  );
  final base = ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: DarmaltonColors.canvas,
    fontFamily: 'Vazirmatn',
    useMaterial3: true,
  );

  return base.copyWith(
    textTheme: base.textTheme
        .apply(
          fontFamily: 'Vazirmatn',
          bodyColor: DarmaltonColors.ink,
          displayColor: DarmaltonColors.ink,
        )
        .copyWith(
          headlineLarge: const TextStyle(
            fontSize: 30,
            height: 1.35,
            fontWeight: FontWeight.w700,
            color: DarmaltonColors.teal,
          ),
          headlineMedium: const TextStyle(
            fontSize: 24,
            height: 1.4,
            fontWeight: FontWeight.w700,
            color: DarmaltonColors.ink,
          ),
          headlineSmall: const TextStyle(
            fontSize: 21,
            height: 1.45,
            fontWeight: FontWeight.w700,
            color: DarmaltonColors.ink,
          ),
          titleLarge: const TextStyle(
            fontSize: 19,
            height: 1.45,
            fontWeight: FontWeight.w700,
            color: DarmaltonColors.ink,
          ),
          titleMedium: const TextStyle(
            fontSize: 16,
            height: 1.5,
            fontWeight: FontWeight.w600,
            color: DarmaltonColors.ink,
          ),
          bodyLarge: const TextStyle(
            fontSize: 16,
            height: 1.65,
            color: DarmaltonColors.ink,
          ),
          bodyMedium: const TextStyle(
            fontSize: 14,
            height: 1.65,
            color: DarmaltonColors.muted,
          ),
          labelLarge: const TextStyle(
            fontSize: 15,
            height: 1.4,
            fontWeight: FontWeight.w600,
          ),
        ),
    appBarTheme: const AppBarTheme(
      backgroundColor: DarmaltonColors.canvas,
      foregroundColor: DarmaltonColors.ink,
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: 'Vazirmatn',
        color: DarmaltonColors.teal,
        fontSize: 24,
        fontWeight: FontWeight.w700,
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        side: const BorderSide(color: DarmaltonColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: const TextStyle(color: Color(0xFF98A2B3)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        borderSide: const BorderSide(color: DarmaltonColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        borderSide: const BorderSide(color: DarmaltonColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        borderSide: const BorderSide(color: DarmaltonColors.teal, width: 1.5),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        backgroundColor: DarmaltonColors.teal,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        ),
        textStyle: const TextStyle(
          fontFamily: 'Vazirmatn',
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 50),
        foregroundColor: DarmaltonColors.teal,
        side: const BorderSide(color: DarmaltonColors.teal),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        ),
        textStyle: const TextStyle(
          fontFamily: 'Vazirmatn',
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 76,
      elevation: 0,
      backgroundColor: Colors.white,
      indicatorColor: DarmaltonColors.mintStrong,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontFamily: 'Vazirmatn',
          fontSize: 11,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w700
              : FontWeight.w400,
          color: states.contains(WidgetState.selected)
              ? DarmaltonColors.teal
              : DarmaltonColors.muted,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          size: 25,
          color: states.contains(WidgetState.selected)
              ? DarmaltonColors.teal
              : DarmaltonColors.ink,
        ),
      ),
    ),
    dividerTheme: const DividerThemeData(color: DarmaltonColors.line),
  );
}

class DarmaltonCard extends StatelessWidget {
  const DarmaltonCard({
    required this.child,
    this.padding = const EdgeInsets.all(DarmaltonSpace.md),
    this.onTap,
    this.color = Colors.white,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color color;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
      border: Border.all(color: DarmaltonColors.line),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0B101828),
          blurRadius: 18,
          offset: Offset(0, 6),
        ),
      ],
    ),
    child: Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
        child: Padding(padding: padding, child: child),
      ),
    ),
  );
}

class GradientButton extends StatelessWidget {
  const GradientButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.loading = false,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: onPressed == null ? null : DarmaltonColors.primaryGradient,
      color: onPressed == null ? const Color(0xFFCDD5DF) : null,
      borderRadius: BorderRadius.circular(DarmaltonRadius.medium),
      boxShadow: onPressed == null
          ? null
          : const [
              BoxShadow(
                color: Color(0x26079C9A),
                blurRadius: 16,
                offset: Offset(0, 7),
              ),
            ],
    ),
    child: FilledButton.icon(
      onPressed: loading ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: Colors.transparent,
        disabledBackgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
      ),
      icon: loading
          ? const SizedBox.square(
              dimension: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Icon(icon),
      label: Text(label),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({
    required this.title,
    this.action,
    this.onAction,
    super.key,
  });

  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: Text(title, style: Theme.of(context).textTheme.titleLarge),
      ),
      if (action != null) TextButton(onPressed: onAction, child: Text(action!)),
    ],
  );
}

class StatusChip extends StatelessWidget {
  const StatusChip({
    required this.label,
    required this.icon,
    required this.color,
    super.key,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.10),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(color: color, fontWeight: FontWeight.w600),
        ),
      ],
    ),
  );
}

class LtrText extends StatelessWidget {
  const LtrText(
    this.value, {
    this.style,
    this.textAlign = TextAlign.start,
    this.maxLines,
    super.key,
  });

  final String value;
  final TextStyle? style;
  final TextAlign textAlign;
  final int? maxLines;

  @override
  Widget build(BuildContext context) => Directionality(
    textDirection: TextDirection.ltr,
    child: Text(
      value,
      style: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
    ),
  );
}
