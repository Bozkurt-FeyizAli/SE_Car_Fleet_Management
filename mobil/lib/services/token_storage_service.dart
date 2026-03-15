import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// JWT token'ı güvenli bir şekilde saklar, okur ve siler.
/// Android'de EncryptedSharedPreferences, iOS'ta Keychain kullanır.
class TokenStorageService {
  static const _tokenKey = 'jwt_token';
  static const _userDataKey = 'user_data';

  final FlutterSecureStorage _storage;

  TokenStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  /// JWT token'ı güvenli storage'a kaydeder.
  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  /// Saklı JWT token'ı döner. Yoksa `null` döner.
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  /// Saklı JWT token'ı siler.
  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  /// Kullanıcı verisini string olarak saklar (JSON encode edilmiş).
  Future<void> saveUserData(String userData) async {
    await _storage.write(key: _userDataKey, value: userData);
  }

  /// Saklı kullanıcı verisini döner.
  Future<String?> getUserData() async {
    return await _storage.read(key: _userDataKey);
  }

  /// Tüm saklı verileri temizler (logout).
  Future<void> clearAll() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userDataKey);
  }
}
