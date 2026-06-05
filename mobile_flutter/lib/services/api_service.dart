import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';
import '../models/user.dart';

class ApiService {
  late final Dio _dio;
  String? _sessionId;
  SharedPreferences? _prefs;

  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Use header-based auth
          _prefs ??= await SharedPreferences.getInstance();
          final userId = _prefs!.getString(AppConstants.userIdKey);
          final userRole = _prefs!.getString(AppConstants.userRoleKey);
          if (userId != null && userRole != null) {
            options.headers['X-User-ID'] = userId;
            options.headers['X-User-Role'] = userRole;
          }
          // Also send cookie if we have one
          if (_sessionId != null) {
            options.headers['Cookie'] = 'sessionid=$_sessionId';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          // Capture session cookie from login response
          final cookies = response.headers['set-cookie'];
          if (cookies != null && cookies.isNotEmpty) {
            final cookie = cookies.first;
            final match = RegExp(r'sessionid=([^;]+)').firstMatch(cookie);
            if (match != null) {
              _sessionId = match.group(1);
            }
          }
          return handler.next(response);
        },
      ),
    );
  }

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/api/auth/login/',
        data: {'email': email, 'password': password},
      );
      final user = User.fromJson(response.data['user']);
      _prefs ??= await SharedPreferences.getInstance();
      await _prefs!.setString(AppConstants.userIdKey, user.id.toString());
      await _prefs!.setString(AppConstants.userRoleKey, user.role);
      return {'user': user};
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) {
        final errorMessage =
            e.response?.data['error'] ??
            'Account is deactivated. Please contact support.';
        throw Exception(errorMessage);
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String name,
    String role,
  ) async {
    final response = await _dio.post(
      '/api/auth/register/',
      data: {'email': email, 'password': password, 'name': name, 'role': role},
    );
    final user = User.fromJson(response.data['user']);
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs!.setString(AppConstants.userIdKey, user.id.toString());
    await _prefs!.setString(AppConstants.userRoleKey, user.role);
    return {'user': user};
  }

  Future<void> logout() async {
    try {
      await _dio.post('/api/auth/logout/');
    } finally {
      _prefs ??= await SharedPreferences.getInstance();
      await _prefs!.remove(AppConstants.userIdKey);
      await _prefs!.remove(AppConstants.userRoleKey);
      _sessionId = null;
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get('/api/auth/me/');
      return User.fromJson(response.data['user']);
    } catch (e) {
      return null;
    }
  }

  Future<bool> isAuthenticated() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!.getString(AppConstants.userIdKey) != null;
  }

  // Pets
  Future<List<dynamic>> getPets() async {
    final response = await _dio.get('/api/pets/');
    return response.data['pets'] as List;
  }

  Future<dynamic> createPet(Map<String, dynamic> data) async {
    final response = await _dio.post('/api/pets/', data: data);
    return response.data['pet'];
  }

  Future<dynamic> updatePet(int id, Map<String, dynamic> data) async {
    data['id'] = id;
    final response = await _dio.patch('/api/pets/', data: data);
    return response.data['pet'];
  }

  Future<void> archivePet(int id) async {
    await _dio.patch('/api/pets/', data: {'id': id, 'is_active': false});
  }

  Future<void> restorePet(int id) async {
    await _dio.patch('/api/pets/', data: {'id': id, 'is_active': true});
  }

  // Appointments
  Future<List<dynamic>> getAppointments() async {
    final response = await _dio.get('/api/appointments/');
    return response.data['appointments'] as List;
  }

  Future<dynamic> createAppointment(Map<String, dynamic> data) async {
    final response = await _dio.post('/api/appointments/', data: data);
    return response.data['appointment'];
  }

  Future<void> cancelAppointment(int id) async {
    await _dio.patch('/api/appointments/?id=$id', data: {'is_active': false});
  }

  // Health Records
  Future<List<dynamic>> getHealthRecords() async {
    final response = await _dio.get('/api/health-records/');
    return response.data['records'] as List;
  }

  // Prescriptions
  Future<List<dynamic>> getPrescriptions() async {
    final response = await _dio.get('/api/prescriptions/');
    return response.data['prescriptions'] as List;
  }

  // Vaccinations
  Future<List<dynamic>> getVaccinations() async {
    final response = await _dio.get('/api/vaccinations/');
    return response.data['vaccinations'] as List;
  }

  Future<void> updateVaccination(int id, Map<String, dynamic> data) async {
    await _dio.put('/api/vaccinations/?id=$id', data: data);
  }

  Future<void> updatePrescription(int id, Map<String, dynamic> data) async {
    await _dio.put('/api/prescriptions/?id=$id', data: data);
  }

  // Staff
  Future<List<dynamic>> getStaff() async {
    final response = await _dio.get('/api/staff/');
    return response.data['staff'] as List;
  }

  // Cameras
  Future<List<dynamic>> getCameras() async {
    final response = await _dio.get('/api/cameras/');
    return response.data['cameras'] as List;
  }

  // Pet Locations
  Future<List<dynamic>> getPetLocations() async {
    final response = await _dio.get('/api/pet-locations/');
    return response.data['locations'] as List;
  }

  // Rooms
  Future<List<dynamic>> getRooms() async {
    final response = await _dio.get('/api/rooms/');
    return response.data['rooms'] as List;
  }

  // Notifications
  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get('/api/notifications/');
    return response.data['notifications'] as List;
  }

  Future<void> markNotificationRead(int id) async {
    await _dio.patch('/api/notifications/', data: {'id': id});
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.patch('/api/notifications/', data: {'mark_all_read': true});
  }

  // Medication Reminders
  Future<List<Map<String, dynamic>>> checkReminders() async {
    try {
      final response = await _dio.post('/api/check-reminders/');
      return (response.data['reminders'] as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }
}
