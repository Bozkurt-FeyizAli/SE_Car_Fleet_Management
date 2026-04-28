import 'dart:convert';

enum UserRole {
  superAdmin,
  company,
  driver,
  unknown;

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
        return UserRole.unknown;
    }
  }

  /// Backend'den gelen roleId'den (0 tabanlı enum) UserRole oluşturur.
  /// roleId: 0 = superAdmin, 1 = company, 2 = driver
  static UserRole fromRoleId(int roleId) {
    switch (roleId) {
      case 0:
        return UserRole.superAdmin;
      case 1:
        return UserRole.company;
      case 2:
        return UserRole.driver;
      default:
        return UserRole.unknown;
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
      case UserRole.unknown:
        return 'unknown';
    }
  }

  int toRoleId() {
    switch (this) {
      case UserRole.superAdmin:
        return 0;
      case UserRole.company:
        return 1;
      case UserRole.driver:
        return 2;
      case UserRole.unknown:
        return -1;
    }
  }
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? token;
  final int? companyId;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.token,
    this.companyId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    int roleId = (json['roleId'] as num?)?.toInt() ?? 2;
    return UserModel(
      id: json['id'].toString(),
      name: json['name'] as String,
      email: json['email'] as String,
      role: UserRole.fromRoleId(roleId),
      token: json['token'] as String?,
      companyId: (json['companyId'] as num?)?.toInt(),
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
    int? roleId;
    
    // API yanıtında roleId int veya string dönebilir
    final incomingRole = json['roleId'] ?? json['role'];
    if (incomingRole != null) {
      if (incomingRole is int) {
        roleId = incomingRole;
      } else {
        roleId = int.tryParse(incomingRole.toString());
      }
    }

    // JWT Token'dan claim okuma sırası
    if (roleId == null && json['token'] != null) {
      try {
        final tokenStr = json['token'] as String;
        final parts = tokenStr.split('.');
        if (parts.length >= 2) {
          String normalized = base64.normalize(parts[1]);
          final payload = ascii.decode(base64.decode(normalized));
          final payloadMap = jsonDecode(payload) as Map<String, dynamic>;

          // Tüm olası role claim key'lerini kontrol et
          var roleClaim = payloadMap['role'] ??
              payloadMap['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
              payloadMap['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];

          if (roleClaim != null) {
            if (roleClaim is int) {
              roleId = roleClaim;
            } else {
              String rStr = roleClaim.toString().toLowerCase();
              roleId = int.tryParse(rStr);
              if (roleId == null) {
                // Eğer int parse edilemediyse String olarak isimlendirilmiş olabilir
                if (rStr.contains('admin') || rStr == '0') roleId = 0;
                else if (rStr.contains('company') || rStr.contains('manager') || rStr == '1') roleId = 1;
                else if (rStr.contains('driver') || rStr.contains('sofor') || rStr == '2' || rStr == '3') roleId = 2;
              }
            }
          }
        }
      } catch (e) {
        print('Token decode hatası: $e');
      }
    }

    // Hala null ise gelen veriye göre bir isim araması da yapalım, son çare olarak 1 (Company) kullan
    if (roleId == null && incomingRole != null) {
      String rStr = incomingRole.toString().toLowerCase();
      if (rStr.contains('admin') || rStr == '0') roleId = 0;
      else if (rStr.contains('company') || rStr.contains('manager') || rStr == '1') roleId = 1;
      else if (rStr.contains('driver') || rStr.contains('sofor') || rStr == '2' || rStr == '3') roleId = 2;
    }
    
    // Tüm denemelere rağmen boşsa bilinmeyen (unknown) rol ata (sayısal olarak -1)
    roleId ??= -1;

    return UserModel(
      id: json['userId']?.toString() ?? json['id']?.toString() ?? '0',
      name: '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
      email: json['email'] as String? ?? 'bilinmeyen@hesap.com',
      role: UserRole.fromRoleId(roleId),
      token: json['token'] as String?,
      companyId: (json['companyId'] as num?)?.toInt(),
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
      if (companyId != null) 'companyId': companyId,
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
      companyId: companyId,
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
      case UserRole.unknown:
        return 'Bilinmeyen Yetki';
    }
  }
}
