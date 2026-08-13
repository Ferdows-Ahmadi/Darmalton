import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_endpoint_manager.dart';
import 'strings.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.fields = const {}, this.statusCode});
  final String message;
  final Map<String, dynamic> fields;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({
    Dio? dio,
    FlutterSecureStorage? storage,
    String? baseUrl,
    ApiEndpointManager? endpointManager,
  }) : _storage = storage ?? const FlutterSecureStorage(),
       _endpointManager =
           endpointManager ?? ApiEndpointManager(configuredEndpoint: baseUrl),
       _dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: ApiEndpointManager.usbEndpoint,
               connectTimeout: const Duration(seconds: 12),
               receiveTimeout: const Duration(seconds: 20),
               headers: {'Accept': 'application/json'},
             ),
           ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.baseUrl = await _endpointManager.ensureResolved();
          final token = await _storage.read(key: 'access_token');
          if (token != null && shouldAttachAuthorization(options)) {
            options.headers['Authorization'] = 'Bearer $token';
          }
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
                  options: Options(
                    extra: {'retried': true, 'skipAuthorization': true},
                  ),
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
          if (error.type == DioExceptionType.connectionError ||
              error.type == DioExceptionType.connectionTimeout) {
            _endpointManager.markRequestFailure();
          }
          handler.next(error);
        },
        onResponse: (response, handler) {
          _endpointManager.markRequestSuccess();
          handler.next(response);
        },
      ),
    );
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;
  final ApiEndpointManager _endpointManager;

  static String normalizeApiBaseUrl(String value) {
    return ApiEndpointManager.normalizeApiBaseUrl(value);
  }

  static bool shouldAttachAuthorization(RequestOptions options) {
    return options.extra['skipAuthorization'] != true;
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

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  ApiException _mapError(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is Map<String, dynamic>) {
      final details = data['error'] as Map<String, dynamic>;
      return ApiException(
        details['message'] as String? ??
            DariStrings.t(
              'درخواست انجام نشد. دوباره کوشش کنید.',
              'The request could not be completed. Try again.',
            ),
        fields: details['fields'] as Map<String, dynamic>? ?? const {},
        statusCode: error.response?.statusCode,
      );
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return ApiException(
        DariStrings.t(
          'ارتباط با داروخانه برقرار نشد. اینترنت خود را بررسی و دوباره کوشش کنید.',
          'Could not reach the pharmacy. Check your internet connection and try again.',
        ),
      );
    }
    return ApiException(
      DariStrings.t(
        'مشکلی رخ داد. دوباره کوشش کنید.',
        'Something went wrong. Try again.',
      ),
      statusCode: error.response?.statusCode,
    );
  }
}
