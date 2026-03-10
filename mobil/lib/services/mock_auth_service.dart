import '../models/user_model.dart';
import 'auth_service.dart';

/// Mock implementasyon — gerçek backend olmadan test için kullanılır.
/// [AuthService] arayüzünü implement eder.
class MockAuthService implements AuthService {
  UserModel? _currentUser;

  // Mock kullanıcı veritabanı
  final List<Map<String, dynamic>> _mockUsers = [
    {
      'id': '1',
      'name': 'Admin Kullanıcı',
      'email': 'admin@filo.com',
      'password': 'admin123',
      'role': UserRole.superAdmin,
    },
    {
      'id': '2',
      'name': 'ABC Lojistik',
      'email': 'sirket@filo.com',
      'password': 'sirket123',
      'role': UserRole.company,
    },
    {
      'id': '3',
      'name': 'Ahmet Yılmaz',
      'email': 'sofor@filo.com',
      'password': 'sofor123',
      'role': UserRole.driver,
    },
  ];

  @override
  Future<UserModel> login(String email, String password) async {
    // Backend gecikmesini simüle et
    await Future.delayed(const Duration(milliseconds: 800));

    for (final user in _mockUsers) {
      if (user['email'] == email && user['password'] == password) {
        // Mock JWT token oluştur
        final mockToken = 'mock_jwt_${user['id']}_${DateTime.now().millisecondsSinceEpoch}';

        _currentUser = UserModel(
          id: user['id'],
          name: user['name'],
          email: user['email'],
          role: user['role'],
          token: mockToken,
        );

        return _currentUser!;
      }
    }

    throw Exception('E-posta veya şifre hatalı');
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _currentUser = null;
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    return _currentUser;
  }

  @override
  Future<bool> isLoggedIn() async {
    return _currentUser != null;
  }
}
