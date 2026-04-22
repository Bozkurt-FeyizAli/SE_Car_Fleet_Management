import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/api_auth_service.dart';

void main() {
  // =========================================================
  // AUTH SERVİS SEÇİMİ
  // ---------------------------------------------------------
  // Mock servise dönmek için:
  //   import 'services/mock_auth_service.dart';
  //   final authService = MockAuthService();
  // =========================================================
  final authService = ApiAuthService(baseUrl: 'http://mikbalceyhan.me');

  runApp(MyApp(authService: authService));
}

class MyApp extends StatelessWidget {
  final AuthService authService;

  const MyApp({super.key, required this.authService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fleet Master',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF2563EB),
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF2563EB),
          secondary: const Color(0xFF22D3EE),
          surface: const Color(0xFF0F172A),
          error: Colors.redAccent,
        ),
        fontFamily: 'Roboto',
      ),
      home: LoginScreen(authService: authService),
    );
  }
}
