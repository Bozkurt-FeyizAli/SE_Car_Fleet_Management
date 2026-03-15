import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'register_screen.dart';

/// Kayıt için rol seçim ekranı.
/// Yönetici (Company) veya Sürücü (Driver) seçilebilir.
class RoleSelectionScreen extends StatelessWidget {
  final AuthService authService;

  const RoleSelectionScreen({super.key, required this.authService});

  // Renk paleti — Login ekranıyla uyumlu
  static const _bgColor = Color(0xFF020617);
  static const _cardColor = Color(0xFF0F172A);
  static const _borderColor = Color(0xFF1E293B);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Başlık
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [Colors.white, Color(0xFF94A3B8)],
                ).createShader(bounds),
                child: const Text(
                  'Nasıl Kaydolmak İstiyorsunuz?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Lütfen rolünüzü seçin',
                style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 40),

              // Yönetici Kartı
              _buildRoleCard(
                context,
                icon: Icons.business_rounded,
                title: 'Yönetici',
                subtitle: 'Şirket yöneticisi olarak kaydolun.\nFilo ve sürücü yönetimi yapabilirsiniz.',
                gradientColors: [const Color(0xFF43A047), const Color(0xFF66BB6A)],
                roleId: 2,
              ),
              const SizedBox(height: 20),

              // Sürücü Kartı
              _buildRoleCard(
                context,
                icon: Icons.directions_car_rounded,
                title: 'Sürücü',
                subtitle: 'Sürücü olarak kaydolun.\nAraç kiralama ve görev takibi yapabilirsiniz.',
                gradientColors: [const Color(0xFFFFA726), const Color(0xFFFFB74D)],
                roleId: 3,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> gradientColors,
    required int roleId,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => RegisterScreen(
              authService: authService,
              roleId: roleId,
              roleTitle: title,
            ),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: _cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _borderColor),
          boxShadow: [
            BoxShadow(
              color: gradientColors[0].withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // İkon
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: gradientColors),
                boxShadow: [
                  BoxShadow(
                    color: gradientColors[0].withOpacity(0.3),
                    blurRadius: 12,
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 20),
            // Metin
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.white.withOpacity(0.3),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
