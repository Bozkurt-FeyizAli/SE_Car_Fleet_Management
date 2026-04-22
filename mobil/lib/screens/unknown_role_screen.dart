import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'shared_styles.dart';
import 'login_screen.dart';
import '../services/auth_service.dart';

class UnknownRoleScreen extends StatelessWidget {
  final AuthService authService;

  const UnknownRoleScreen({super.key, required this.authService});

  void _logoutAndReturn(BuildContext context) async {
    await authService.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(authService: authService)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: const Text('Yetkisiz Giriş', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: kCard,
        elevation: 0,
        shape: const Border(bottom: BorderSide(color: kBorder)),
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 40),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Tanımlanamayan Rol',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Giriş bilgileriniz doğrulandı ancak bu hesap için sistemde geçerli bir yetki tipi (Sistem Yöneticisi, Şirket Yöneticisi veya Şoför) bulunamadı.\n\nLütfen destek ekibi ile iletişime geçiniz.',
                  style: TextStyle(color: kMuted, fontSize: 14, height: 1.5),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kBlue,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () => _logoutAndReturn(context),
                    icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 18),
                    label: const Text(
                      'Giriş Ekranına Dön',
                      style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

