import 'package:darmalton_pharmacy/src/core/api_endpoint_manager.dart';
import 'package:flutter_test/flutter_test.dart';

class _MemoryEndpointStore implements ApiEndpointStore {
  final values = <String, String>{};

  @override
  Future<void> delete(String key) async => values.remove(key);

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async => values[key] = value;
}

void main() {
  test('development resolution prefers USB then discovered LAN', () async {
    final probes = <String>[];
    final manager = ApiEndpointManager(
      store: _MemoryEndpointStore(),
      developmentMode: true,
      discover: () async => 'http://192.168.1.44:8000',
      probe: (endpoint) async {
        probes.add(endpoint);
        return endpoint.contains('192.168.1.44');
      },
    );

    final endpoint = await manager.ensureResolved();

    expect(endpoint, 'http://192.168.1.44:8000/api/v1');
    expect(probes, [
      'http://127.0.0.1:8000/api/v1',
      'http://192.168.1.44:8000/api/v1',
    ]);
    expect(manager.snapshot.method, ApiConnectionMethod.lan);
    expect(manager.snapshot.healthy, isTrue);
  });

  test(
    'last successful LAN endpoint is retried without network scanning',
    () async {
      final store = _MemoryEndpointStore()
        ..values['dev_api_last_endpoint'] = 'http://10.20.30.40:8000/api/v1';
      final probes = <String>[];
      final manager = ApiEndpointManager(
        store: store,
        developmentMode: true,
        discover: () async => null,
        probe: (endpoint) async {
          probes.add(endpoint);
          return endpoint.contains('10.20.30.40');
        },
      );

      await manager.ensureResolved();

      expect(probes.length, 2);
      expect(manager.snapshot.method, ApiConnectionMethod.rememberedLan);
    },
  );

  test('production mode never runs development discovery', () async {
    var discoveryCalled = false;
    final manager = ApiEndpointManager(
      store: _MemoryEndpointStore(),
      developmentMode: false,
      configuredEndpoint: 'https://api.example.test',
      discover: () async {
        discoveryCalled = true;
        return 'http://192.168.1.1:8000';
      },
      probe: (endpoint) async => true,
    );

    final endpoint = await manager.ensureResolved();

    expect(endpoint, 'https://api.example.test/api/v1');
    expect(discoveryCalled, isFalse);
    expect(manager.snapshot.method, ApiConnectionMethod.production);
  });

  test('manual development override rejects public cleartext hosts', () async {
    final manager = ApiEndpointManager(
      store: _MemoryEndpointStore(),
      developmentMode: true,
      discover: () async => null,
      probe: (endpoint) async => false,
    );

    expect(
      () => manager.setManualEndpoint('http://203.0.113.10:8000'),
      throwsA(isA<FormatException>()),
    );
  });
}
