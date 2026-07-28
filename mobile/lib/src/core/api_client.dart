import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.fields = const {}, this.statusCode});
  final String message;
  final Map<String, dynamic> fields;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({Dio? dio, FlutterSecureStorage? storage, String? baseUrl})
    : _storage = storage ?? const FlutterSecureStorage(),
      _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: normalizeApiBaseUrl(
                baseUrl ??
                    const String.fromEnvironment(
                      'API_BASE_URL',
                      defaultValue: 'http://10.0.2.2:8000/api/v1',
                    ),
              ),
              connectTimeout: const Duration(seconds: 12),
              receiveTimeout: const Duration(seconds: 20),
              headers: {'Accept': 'application/json'},
            ),
          ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              !error.requestOptions.extra.containsKey('retried')) {
            final refresh = await _storage.read(key: 'refresh_token');
            if (refresh != null) {
              try {
                final response = await _dio.post<Map<String, dynamic>>(
                  '/auth/refresh/',
                  data: {'refresh': refresh},
                  options: Options(extra: {'retried': true}),
                );
                await saveTokens(response.data!);
                final request = error.requestOptions;
                request.extra['retried'] = true;
                request.headers['Authorization'] =
                    'Bearer ${response.data!['access']}';
                return handler.resolve(await _dio.fetch(request));
              } on DioException {
                await clearTokens();
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;

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

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? query}) async {
    try {
      return await _dio.get<T>(path, queryParameters: query);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Response<T>> post<T>(String path, {Object? data}) async {
    try {
      return await _dio.post<T>(path, data: data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Response<T>> postFile<T>(
    String path, {
    required String filePath,
    required String filename,
    required Map<String, String> fields,
    ProgressCallback? onSendProgress,
  }) async {
    final extension = filename.toLowerCase().split('.').last;
    final contentType = switch (extension) {
      'jpg' || 'jpeg' => DioMediaType('image', 'jpeg'),
      'png' => DioMediaType('image', 'png'),
      'pdf' => DioMediaType('application', 'pdf'),
      _ => DioMediaType('application', 'octet-stream'),
    };
    try {
      final form = FormData.fromMap({
        ...fields,
        'document': await MultipartFile.fromFile(
          filePath,
          filename: filename,
          contentType: contentType,
        ),
      });
      return await _dio.post<T>(
        path,
        data: form,
        onSendProgress: onSendProgress,
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Response<T>> patch<T>(String path, {Object? data}) async {
    try {
      return await _dio.patch<T>(path, data: data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete<void>(path);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> saveTokens(Map<String, dynamic> payload) async {
    await _storage.write(
      key: 'access_token',
      value: payload['access'] as String,
    );
    final refresh = payload['refresh'] as String?;
    if (refresh != null) {
      await _storage.write(key: 'refresh_token', value: refresh);
    }
  }

  Future<void> clearTokens() => _storage.deleteAll();

  ApiException _mapError(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is Map<String, dynamic>) {
      final details = data['error'] as Map<String, dynamic>;
      return ApiException(
        details['message'] as String? ?? 'درخواست انجام نشد. دوباره کوشش کنید.',
        fields: details['fields'] as Map<String, dynamic>? ?? const {},
        statusCode: error.response?.statusCode,
      );
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return const ApiException(
        'ارتباط با داروخانه برقرار نشد. اینترنت خود را بررسی و دوباره کوشش کنید.',
      );
    }
    return ApiException(
      'مشکلی رخ داد. دوباره کوشش کنید.',
      statusCode: error.response?.statusCode,
    );
  }
}
