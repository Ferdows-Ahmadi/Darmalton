import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'models.dart';

const _guestCartKey = 'darmalton_guest_cart_v1';
const _guestPromptKey = 'darmalton_guest_prompt_seen_v1';

class GuestCartEntry {
  const GuestCartEntry({required this.medicine, required this.quantity});

  factory GuestCartEntry.fromJson(Map<String, dynamic> json) => GuestCartEntry(
    medicine: Medicine.fromJson(json['medicine'] as Map<String, dynamic>),
    quantity: json['quantity'] as int,
  );

  final Medicine medicine;
  final int quantity;

  Map<String, dynamic> toJson() => {
    'medicine': medicine.toJson(),
    'quantity': quantity,
  };

  GuestCartEntry copyWith({int? quantity}) =>
      GuestCartEntry(medicine: medicine, quantity: quantity ?? this.quantity);
}

abstract interface class GuestSessionStore {
  Future<List<GuestCartEntry>> loadCart();
  Future<void> saveCart(List<GuestCartEntry> entries);
  Future<bool> hasSeenAccountPrompt();
  Future<void> markAccountPromptSeen();
}

class SecureGuestSessionStore implements GuestSessionStore {
  SecureGuestSessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<List<GuestCartEntry>> loadCart() async {
    final value = await _storage.read(key: _guestCartKey);
    if (value == null || value.isEmpty) return const [];
    try {
      final decoded = jsonDecode(value) as List<dynamic>;
      return decoded
          .map((item) => GuestCartEntry.fromJson(item as Map<String, dynamic>))
          .toList();
    } on FormatException {
      await _storage.delete(key: _guestCartKey);
      return const [];
    }
  }

  @override
  Future<void> saveCart(List<GuestCartEntry> entries) async {
    if (entries.isEmpty) {
      await _storage.delete(key: _guestCartKey);
      return;
    }
    await _storage.write(
      key: _guestCartKey,
      value: jsonEncode(entries.map((entry) => entry.toJson()).toList()),
    );
  }

  @override
  Future<bool> hasSeenAccountPrompt() async =>
      await _storage.read(key: _guestPromptKey) == 'true';

  @override
  Future<void> markAccountPromptSeen() =>
      _storage.write(key: _guestPromptKey, value: 'true');
}

int moneyToMinorUnits(String? value) {
  final parts = (value ?? '0').split('.');
  final whole = int.tryParse(parts.first) ?? 0;
  final fraction = parts.length > 1
      ? int.tryParse(parts[1].padRight(2, '0').substring(0, 2)) ?? 0
      : 0;
  return whole * 100 + fraction;
}

String minorUnitsToMoney(int value) =>
    '${value ~/ 100}.${(value % 100).toString().padLeft(2, '0')}';
