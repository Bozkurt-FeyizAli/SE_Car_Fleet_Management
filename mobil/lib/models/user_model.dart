import 'dart:convert';

enum UserRole {

  superAdmin,
  company,
  driver;

  /// String rol değerinden UserRole oluşturur (mock servis için).
  static UserRole fromString(String value) {
    switch (value) {
      case 'süper admin':
        return UserRole.superAdmin;
      case 'yonetici':
        return UserRole.company;
      case 'sofor':
        return UserRole.driver;
      default:
        throw ArgumentError('Bilinmeyen rol: $value');
    }
  }

  /// Backend'den gelen roleId'den UserRole oluşturur.
  /// roleId: 1 = superAdmin, 2 = company, 3 = driver
  static UserRole fromRoleId(int roleId) {
    switch (roleId) {
      case 1:
        return UserRole.superAdmin;
      case 2:
        return UserRole.company;
      case 3:
        return UserRole.driver;
      default:
        throw ArgumentError('Bilinmeyen roleId: $roleId');
    }
  }

  String toJsonString() {
    switch (this) {
      case UserRole.superAdmin:
        return 'super_admin';
      case UserRole.company:
        return 'company';
      case UserRole.driver:
        return 'driver';
    }
  }

  int toRoleId() {
    switch (this) {
      case UserRole.superAdmin:
        return 1;
      case UserRole.company:
        return 2;
      case UserRole.driver:
        return 3;
    }
  }
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? token;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    int roleId = (json['roleId'] as num?)?.toInt() ?? 2;
    return UserModel(
      id: json['id'].toString(),
      name: json['name'] as String,
      email: json['email'] as String,
      role: UserRole.fromRoleId(roleId),
      token: json['token'] as String?,
    );
  }

  /// Backend API yanıtından UserModel oluşturur.
  /// Beklenen format:
  /// {
  ///   "token": "...",
  ///   "userId": 1,
  ///   "email": "test@sirket.com",
  ///   "firstName": "Test",
  ///   "lastName": "Yonetici",
  ///   "roleId": 1
  /// }
  factory UserModel.fromApiResponse(Map<String, dynamic> json) {
    int? roleId = (json['roleId'] as num?)?.toInt();
    
    // Eğer roleId API yanıtından gelmemişse (örn. eski sunucu versiyonu), JWT token'dan oku
    if (roleId == null && json['token'] != null) {
      try {
        final tokenStr = json['token'] as String;
        final parts = tokenStr.split('.');
        if (parts.length == 3) {
          final payload = ascii.decode(base64.decode(base64.normalize(parts[1])));
          final payloadMap = jsonDecode(payload) as Map<String, dynamic>;
          
          // ClaimTypes.Role, genelde URL şeklinde gelir veya "role" olarak gelir
          final roleClaim = payloadMap['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                            ?? payloadMap['role'];
          
          if (roleClaim != null) {
            roleId = int.tryParse(roleClaim.toString());
          }
        }
      } catch (e) {
        print('Token decode hatası: $e');
      }
    }
    
    // Hala null ise varsayılan olarak şirket yöneticisi (2) yap
    roleId ??= 2;

    return UserModel(
      id: json['userId']?.toString() ?? json['id']?.toString() ?? '0',
      name: '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
      email: json['email'] as String,
      role: UserRole.fromRoleId(roleId),
      token: json['token'] as String?,
    );
  }

  /// UserModel'i JSON'a çevirir.
  /// roleId'yi int olarak saklar — fromJson() ile uyumlu.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'roleId': role.toRoleId(),
      if (token != null) 'token': token,
    };
  }

  /// Token ile yeni bir UserModel kopyası oluşturur.
  UserModel copyWithToken(String? newToken) {
    return UserModel(
      id: id,
      name: name,
      email: email,
      role: role,
      token: newToken,
    );
  }

  String get roleName {
    switch (role) {
      case UserRole.superAdmin:
        return 'Süper Admin';
      case UserRole.company:
        return 'Şirket';
      case UserRole.driver:
        return 'Şoför';
    }
  }
}
