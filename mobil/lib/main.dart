import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/mock_auth_service.dart';
// Backend hazır olduğunda aşağıdaki import'u aktif edin:
// import 'services/api_auth_service.dart';

void main() {
  // =========================================================
  // AUTH SERVİS SEÇİMİ
  // ---------------------------------------------------------
  // Şimdilik MockAuthService kullanılıyor.
  // Backend hazır olduğunda aşağıdaki satırı değiştirin:
  //   final authService = ApiAuthService(baseUrl: 'https://api.example.com');
  // =========================================================
  final authService = MockAuthService();

  runApp(MyApp(authService: authService));
}

class MyApp extends StatelessWidget {
  final AuthService authService;

  const MyApp({super.key, required this.authService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Filo Yönetimi',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF1E88E5),
        scaffoldBackgroundColor: const Color(0xFF0A0E21),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF1E88E5),
          secondary: const Color(0xFF42A5F5),
          surface: const Color(0xFF1A2332),
          error: Colors.redAccent,
        ),
        fontFamily: 'Roboto',
      ),
      home: LoginScreen(authService: authService),
    );
  }
}
