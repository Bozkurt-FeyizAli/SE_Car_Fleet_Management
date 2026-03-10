import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import 'admin_home_screen.dart';
import 'company_home_screen.dart';
import 'driver_home_screen.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;

  const LoginScreen({super.key, required this.authService});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.easeOutCubic,
          ),
        );
    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await widget.authService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (!mounted) return;

      // Kullanıcı tipine göre yönlendirme
      Widget targetScreen;
      switch (user.role) {
        case UserRole.superAdmin:
          targetScreen = AdminHomeScreen(
            user: user,
            authService: widget.authService,
          );
          break;
        case UserRole.company:
          targetScreen = CompanyHomeScreen(
            user: user,
            authService: widget.authService,
          );
          break;
        case UserRole.driver:
          targetScreen = DriverHomeScreen(
            user: user,
            authService: widget.authService,
          );
          break;
      }

      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => targetScreen));
    } catch (e) {
      setState(() {
        _errorMessage = 'E-posta veya şifre hatalı';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A0E21), Color(0xFF0D1B2A), Color(0xFF1B2838)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Login Kartı
                      Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A2332).withOpacity(0.8),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.08),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 30,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Başlık
                            const Text(
                              'Filo Yönetimi',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Hesabınıza erişmek için bilgilerinizi girin',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withOpacity(0.5),
                              ),
                            ),
                            const SizedBox(height: 28),
                            Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // E-posta Alanı
                                  _buildLabel('E-posta'),
                                  const SizedBox(height: 8),
                                  _buildEmailField(),
                                  const SizedBox(height: 20),

                                  // Şifre Alanı
                                  _buildLabel('Şifre'),
                                  const SizedBox(height: 8),
                                  _buildPasswordField(),
                                  const SizedBox(height: 8),

                                  // Hata Mesajı
                                  if (_errorMessage != null) ...[
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 10,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: Colors.red.withOpacity(0.3),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.error_outline,
                                            color: Colors.redAccent,
                                            size: 18,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              _errorMessage!,
                                              style: const TextStyle(
                                                color: Colors.redAccent,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],

                                  const SizedBox(height: 24),

                                  // Giriş Yap Butonu
                                  _buildLoginButton(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: TextStyle(
        color: Colors.white.withOpacity(0.8),
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: 'ornek@filo.com',
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.25)),
        prefixIcon: Icon(
          Icons.email_outlined,
          color: Colors.white.withOpacity(0.4),
          size: 20,
        ),
        filled: true,
        fillColor: const Color(0xFF0F1923),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1E88E5), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'E-posta adresi gerekli';
        }
        if (!value.contains('@')) {
          return 'Geçerli bir e-posta adresi girin';
        }
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: _obscurePassword,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: '••••••••',
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.25)),
        prefixIcon: Icon(
          Icons.lock_outlined,
          color: Colors.white.withOpacity(0.4),
          size: 20,
        ),
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            color: Colors.white.withOpacity(0.4),
            size: 20,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
        ),
        filled: true,
        fillColor: const Color(0xFF0F1923),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1E88E5), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Şifre gerekli';
        }
        return null;
      },
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1E88E5),
          disabledBackgroundColor: const Color(0xFF1E88E5).withOpacity(0.5),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                'Giriş Yap',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }

  Widget _buildTestAccount(String role, String email, String password) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: GestureDetector(
        onTap: () {
          _emailController.text = email;
          _passwordController.text = password;
        },
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF1E88E5).withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                role,
                style: const TextStyle(
                  color: Color(0xFF42A5F5),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$email / $password',
              style: TextStyle(
                color: Colors.white.withOpacity(0.35),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
