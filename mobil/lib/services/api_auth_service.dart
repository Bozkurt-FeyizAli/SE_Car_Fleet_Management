import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import 'auth_service.dart';
import 'token_storage_service.dart';

/// Gerçek backend ile JWT tabanlı kimlik doğrulama servisi.
/// Backend hazır olduğunda bu sınıftaki TODO'ları doldurun.
class ApiAuthService implements AuthService {
  // TODO: Backend URL'ini buraya yazın
  final String baseUrl;
  final TokenStorageService _tokenStorage;
  final http.Client _httpClient;

  ApiAuthService({
    required this.baseUrl,
    TokenStorageService? tokenStorage,
    http.Client? httpClient,
  })  : _tokenStorage = tokenStorage ?? TokenStorageService(),
        _httpClient = httpClient ?? http.Client();

  @override
  Future<UserModel> login(String email, String password) async {
    // TODO: Backend endpoint'inize göre URL'i güncelleyin
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      // TODO: Backend yanıt formatına göre parse'ı ayarlayın
      // Beklenen format:
      // {
      //   "token": "eyJhbGciOiJIUzI1NiIs...",
      //   "user": {
      //     "id": "1",
      //     "name": "Admin",
      //     "email": "admin@filo.com",
      //     "role": "super_admin"
      //   }
      // }
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      userJson['token'] = token;

      final user = UserModel.fromJson(userJson);

      // Token'ı güvenli storage'a kaydet
      await _tokenStorage.saveToken(token);
      await _tokenStorage.saveUserData(jsonEncode(user.toJson()));

      return user;
    } else if (response.statusCode == 401) {
      throw Exception('E-posta veya şifre hatalı');
    } else {
      throw Exception('Sunucu hatası: ${response.statusCode}');
    }
  }

  @override
  Future<void> logout() async {
    final token = await _tokenStorage.getToken();

    if (token != null) {
      // TODO: Backend'e logout isteği gönderin (opsiyonel)
      try {
        await _httpClient.post(
          Uri.parse('$baseUrl/api/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
      } catch (_) {
        // Logout isteği başarısız olsa bile local token'ı sil
      }
    }

    await _tokenStorage.clearAll();
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    final token = await _tokenStorage.getToken();
    final userData = await _tokenStorage.getUserData();

    if (token == null || userData == null) return null;

    try {
      final userJson = jsonDecode(userData) as Map<String, dynamic>;
      return UserModel.fromJson(userJson);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await _tokenStorage.getToken();
    return token != null;
  }

  /// Authenticated istekler için header oluşturur.
  /// Diğer servislerden çağrılabilir.
  Future<Map<String, String>> getAuthHeaders() async {
    final token = await _tokenStorage.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
