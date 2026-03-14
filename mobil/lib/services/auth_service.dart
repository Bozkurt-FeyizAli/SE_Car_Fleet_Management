import '../models/user_model.dart';

/// Tüm auth implementasyonlarının uyması gereken sözleşme.
/// Mock ve gerçek backend servisleri bu sınıfı implement eder.
abstract class AuthService {
  /// Kullanıcı girişi yapar. Başarılıysa [UserModel] döner,
  /// başarısızsa exception fırlatır.
  Future<UserModel> login(String email, String password);

  /// Oturumu kapatır ve saklı token'ı temizler.
  Future<void> logout();

  /// Saklı token varsa mevcut kullanıcıyı döner,
  /// yoksa `null` döner.
  Future<UserModel?> getCurrentUser();

  /// Kullanıcının oturum açıp açmadığını kontrol eder.
  Future<bool> isLoggedIn();

  /// Yeni kullanıcı kaydı yapar. Başarılıysa mesaj döner,
  /// başarısızsa exception fırlatır.
  Future<String> register({
    required String firstName,
    required String lastName,
    required String email,
    required String userName,
    required String password,
    required String confirmPassword,
    required int roleId,
  });
}
