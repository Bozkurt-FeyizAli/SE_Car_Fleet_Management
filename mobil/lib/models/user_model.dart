enum UserRole {
  superAdmin,
  company,
  driver;

  static UserRole fromString(String value) {
    switch (value) {
      case 'super_admin':
        return UserRole.superAdmin;
      case 'company':
        return UserRole.company;
      case 'driver':
        return UserRole.driver;
      default:
        throw ArgumentError('Bilinmeyen rol: $value');
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

  /// Backend JSON yanıtından UserModel oluşturur.
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: UserRole.fromString(json['role'] as String),
      token: json['token'] as String?,
    );
  }

  /// UserModel'i JSON'a çevirir.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role.toJsonString(),
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
