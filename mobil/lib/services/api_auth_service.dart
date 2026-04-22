import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import 'auth_service.dart';
import 'token_storage_service.dart';

/// Gerçek backend ile JWT tabanlı kimlik doğrulama servisi.
class ApiAuthService implements AuthService {
  String baseUrl = "http://mikbalceyhan.me";
  final TokenStorageService _tokenStorage;
  final http.Client _httpClient;

  ApiAuthService({
    required this.baseUrl,
    TokenStorageService? tokenStorage,
    http.Client? httpClient,
  }) : _tokenStorage = tokenStorage ?? TokenStorageService(),
       _httpClient = httpClient ?? http.Client();

  @override
  Future<UserModel> login(String email, String password) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/api/Auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;

      // Backend yanıt formatı:
      // {
      //   "token": "eyJhbGciOiJIUzI1NiIs...",
      //   "userId": 1,
      //   "email": "test@sirket.com",
      //   "firstName": "Test",
      //   "lastName": "Yonetici",
      //   "roleId": 1
      // }
      final user = UserModel.fromApiResponse(data);
      print(user);

      // Token'ı güvenli storage'a kaydet
      await _tokenStorage.saveToken(user.token!);
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
    // Local token'ı ve kullanıcı verisini temizle
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

  @override
  Future<String> register({
    required String firstName,
    required String lastName,
    required String email,
    required String userName,
    required String password,
    required String confirmPassword,
    required int roleId,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/api/Auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'userName': userName,
        'password': password,
        'confirmPassword': confirmPassword,
        'roleId': roleId,
      }),
    );

    if (response.statusCode == 200) {
      return 'Kayıt başarılı!';
    } else if (response.statusCode == 400) {
      final data = jsonDecode(response.body);
      final message = data is Map
          ? (data['message'] ?? data.toString())
          : response.body;
      throw Exception(message);
    } else {
      throw Exception('Sunucu hatası: ${response.statusCode}');
    }
  }
}
