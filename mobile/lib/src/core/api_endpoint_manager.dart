import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _configuredApiBaseUrl = String.fromEnvironment('API_BASE_URL');
const _safeUnconfiguredProductionUrl =
    'https://api-not-configured.invalid/api/v1';

enum ApiConnectionMethod {
  usb,
  lan,
  rememberedLan,
  manual,
  production,
  offline,
}

class ApiEndpointSnapshot {
  const ApiEndpointSnapshot({
    required this.endpoint,
    required this.method,
    required this.healthy,
    required this.resolving,
    this.lastSuccessfulConnection,
  });

  final String endpoint;
  final ApiConnectionMethod method;
  final bool healthy;
  final bool resolving;
  final DateTime? lastSuccessfulConnection;
}

abstract class ApiEndpointStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class SecureApiEndpointStore implements ApiEndpointStore {
  SecureApiEndpointStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

typedef ApiEndpointProbe = Future<bool> Function(String endpoint);
typedef ApiLanDiscovery = Future<String?> Function();

class ApiEndpointManager extends ChangeNotifier {
  ApiEndpointManager({
    ApiEndpointStore? store,
    ApiEndpointProbe? probe,
    ApiLanDiscovery? discover,
    bool? developmentMode,
    String? configuredEndpoint,
  }) : _store = store ?? SecureApiEndpointStore(),
       _customProbe = probe,
       _customDiscover = discover,
       _developmentMode = developmentMode ?? kDebugMode,
       _configuredEndpoint = configuredEndpoint ?? _configuredApiBaseUrl {
    _snapshot = ApiEndpointSnapshot(
      endpoint: _initialEndpoint,
      method: _developmentMode
          ? ApiConnectionMethod.offline
          : ApiConnectionMethod.production,
      healthy: false,
      resolving: false,
    );
  }

  static const usbEndpoint = 'http://127.0.0.1:8000/api/v1';
  static const _lastEndpointKey = 'dev_api_last_endpoint';
  static const _manualEndpointKey = 'dev_api_manual_endpoint';
  static const _lastSuccessKey = 'dev_api_last_success_at';
  static const _discoveryPort = 53535;
  static const _discoveryRequest = 'DARMALTON_DISCOVER_V1';

  final ApiEndpointStore _store;
  final ApiEndpointProbe? _customProbe;
  final ApiLanDiscovery? _customDiscover;
  final bool _developmentMode;
  final String _configuredEndpoint;
  late ApiEndpointSnapshot _snapshot;
  Future<String>? _activeResolution;

  bool get developmentMode => _developmentMode;
  ApiEndpointSnapshot get snapshot => _snapshot;
  String get endpoint => _snapshot.endpoint;

  String get _initialEndpoint {
    if (_developmentMode) return usbEndpoint;
    if (_configuredEndpoint.trim().isNotEmpty) {
      return normalizeApiBaseUrl(_configuredEndpoint);
    }
    return _safeUnconfiguredProductionUrl;
  }

  static String normalizeApiBaseUrl(String value) {
    final trimmed = value.trim().replaceAll(RegExp(r'/+$'), '');
    if (trimmed.isEmpty) {
      throw ArgumentError.value(value, 'baseUrl', 'must not be empty');
    }
    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw ArgumentError.value(value, 'baseUrl', 'must be an absolute URL');
    }
    if (trimmed.endsWith('/api/v1')) return trimmed;
    if (trimmed.endsWith('/api')) return '$trimmed/v1';
    return '$trimmed/api/v1';
  }

  /// Rebuilds API-owned public media URLs against the endpoint the app can
  /// actually reach. This keeps CMS media usable when a development device
  /// moves between USB reverse, LAN discovery, and a remembered LAN address,
  /// or when a reverse proxy supplies an internal host in an absolute URL.
  static String rebasePublicApiUrl(String value, {required String apiBaseUrl}) {
    final source = Uri.tryParse(value.trim());
    if (source == null || source.path.isEmpty) return value;
    if (!source.path.startsWith('/api/v1/')) return value;

    final base = Uri.parse(normalizeApiBaseUrl(apiBaseUrl));
    return base
        .replace(
          path: source.path,
          query: source.hasQuery ? source.query : null,
          fragment: source.hasFragment ? source.fragment : null,
        )
        .toString();
  }

  String resolvePublicApiUrl(String value) =>
      rebasePublicApiUrl(value, apiBaseUrl: _snapshot.endpoint);

  Future<String> ensureResolved({bool force = false}) {
    if (!force && _snapshot.healthy) return Future.value(_snapshot.endpoint);
    if (_activeResolution != null) return _activeResolution!;
    final resolution = _resolve();
    _activeResolution = resolution;
    return resolution.whenComplete(() => _activeResolution = null);
  }

  Future<String> retryAndDiscover() => ensureResolved(force: true);

  Future<void> setManualEndpoint(String? value) async {
    if (!_developmentMode) return;
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      await _store.delete(_manualEndpointKey);
    } else {
      final normalized = normalizeApiBaseUrl(trimmed);
      if (!_isSafeDevelopmentEndpoint(normalized)) {
        throw const FormatException(
          'Development endpoint must use localhost, a private LAN address, or HTTPS.',
        );
      }
      await _store.write(_manualEndpointKey, normalized);
    }
    await ensureResolved(force: true);
  }

  Future<String?> getManualEndpoint() => _store.read(_manualEndpointKey);

  Future<String> _resolve() async {
    _setSnapshot(resolving: true);
    final lastSuccessValue = await _store.read(_lastSuccessKey);
    final lastSuccess = DateTime.tryParse(lastSuccessValue ?? '');

    if (!_developmentMode) {
      final production = _initialEndpoint;
      final healthy = await _probe(production);
      _snapshot = ApiEndpointSnapshot(
        endpoint: production,
        method: ApiConnectionMethod.production,
        healthy: healthy,
        resolving: false,
        lastSuccessfulConnection: healthy ? DateTime.now() : lastSuccess,
      );
      notifyListeners();
      return production;
    }

    if (await _probe(usbEndpoint)) {
      return _selectHealthyEndpoint(usbEndpoint, ApiConnectionMethod.usb);
    }

    final candidates = <(String, ApiConnectionMethod)>[];
    final discovered = await _discover();
    if (discovered != null && _isSafeDevelopmentEndpoint(discovered)) {
      candidates.add((discovered, ApiConnectionMethod.lan));
    }
    final remembered = await _store.read(_lastEndpointKey);
    if (remembered != null && _isSafeDevelopmentEndpoint(remembered)) {
      candidates.add((remembered, ApiConnectionMethod.rememberedLan));
    }
    final manual = await _store.read(_manualEndpointKey);
    if (manual != null && _isSafeDevelopmentEndpoint(manual)) {
      candidates.add((manual, ApiConnectionMethod.manual));
    }
    if (_configuredEndpoint.trim().isNotEmpty) {
      final configured = normalizeApiBaseUrl(_configuredEndpoint);
      if (_isSafeDevelopmentEndpoint(configured)) {
        candidates.add((configured, ApiConnectionMethod.manual));
      }
    }

    final seen = <String>{};
    for (final candidate in candidates) {
      final normalized = normalizeApiBaseUrl(candidate.$1);
      if (!seen.add(normalized)) continue;
      if (await _probe(normalized)) {
        return _selectHealthyEndpoint(normalized, candidate.$2);
      }
    }

    _snapshot = ApiEndpointSnapshot(
      endpoint: remembered ?? usbEndpoint,
      method: ApiConnectionMethod.offline,
      healthy: false,
      resolving: false,
      lastSuccessfulConnection: lastSuccess,
    );
    notifyListeners();
    return _snapshot.endpoint;
  }

  Future<String> _selectHealthyEndpoint(
    String endpoint,
    ApiConnectionMethod method,
  ) async {
    final normalized = normalizeApiBaseUrl(endpoint);
    final now = DateTime.now();
    await _store.write(_lastEndpointKey, normalized);
    await _store.write(_lastSuccessKey, now.toIso8601String());
    _snapshot = ApiEndpointSnapshot(
      endpoint: normalized,
      method: method,
      healthy: true,
      resolving: false,
      lastSuccessfulConnection: now,
    );
    notifyListeners();
    return normalized;
  }

  Future<bool> _probe(String endpoint) async {
    if (_customProbe != null) return _customProbe(endpoint);
    final uri = Uri.parse('$endpoint/health/');
    try {
      final response = await Dio(
        BaseOptions(
          connectTimeout: const Duration(milliseconds: 900),
          receiveTimeout: const Duration(milliseconds: 900),
          validateStatus: (status) => status == 200,
        ),
      ).getUri<Map<String, dynamic>>(uri);
      return response.statusCode == 200 && response.data?['status'] == 'ok';
    } on DioException {
      return false;
    }
  }

  Future<String?> _discover() async {
    if (_customDiscover != null) return _customDiscover();
    RawDatagramSocket? socket;
    StreamSubscription<RawSocketEvent>? subscription;
    try {
      socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      socket.broadcastEnabled = true;
      final completer = Completer<String?>();
      subscription = socket.listen((event) {
        if (event != RawSocketEvent.read || completer.isCompleted) return;
        final datagram = socket?.receive();
        if (datagram == null) return;
        try {
          final payload = jsonDecode(utf8.decode(datagram.data));
          if (payload is Map<String, dynamic> &&
              payload['service'] == 'darmalton-dev' &&
              payload['version'] == 1 &&
              payload['api_base_url'] is String) {
            final endpoint = normalizeApiBaseUrl(
              payload['api_base_url'] as String,
            );
            if (_isSafeDevelopmentEndpoint(endpoint)) {
              completer.complete(endpoint);
            }
          }
        } on FormatException {
          // Ignore unrelated UDP traffic on the development discovery port.
        }
      });
      socket.send(
        utf8.encode(_discoveryRequest),
        InternetAddress('255.255.255.255'),
        _discoveryPort,
      );
      return await completer.future.timeout(
        const Duration(milliseconds: 900),
        onTimeout: () => null,
      );
    } on SocketException {
      return null;
    } finally {
      await subscription?.cancel();
      socket?.close();
    }
  }

  static bool _isSafeDevelopmentEndpoint(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return false;
    if (uri.scheme == 'https') return true;
    if (uri.scheme != 'http') return false;
    if (uri.host == 'localhost' || uri.host == '127.0.0.1') return true;
    final parts = uri.host.split('.').map(int.tryParse).toList();
    if (parts.length != 4 || parts.any((part) => part == null)) return false;
    final first = parts[0]!;
    final second = parts[1]!;
    return first == 10 ||
        (first == 172 && second >= 16 && second <= 31) ||
        (first == 192 && second == 168);
  }

  void markRequestSuccess() {
    if (_snapshot.healthy) return;
    _setSnapshot(healthy: true, lastSuccessfulConnection: DateTime.now());
  }

  void markRequestFailure() {
    if (!_snapshot.healthy) return;
    _setSnapshot(healthy: false, method: ApiConnectionMethod.offline);
  }

  void _setSnapshot({
    String? endpoint,
    ApiConnectionMethod? method,
    bool? healthy,
    bool? resolving,
    DateTime? lastSuccessfulConnection,
  }) {
    _snapshot = ApiEndpointSnapshot(
      endpoint: endpoint ?? _snapshot.endpoint,
      method: method ?? _snapshot.method,
      healthy: healthy ?? _snapshot.healthy,
      resolving: resolving ?? _snapshot.resolving,
      lastSuccessfulConnection:
          lastSuccessfulConnection ?? _snapshot.lastSuccessfulConnection,
    );
    notifyListeners();
  }
}
