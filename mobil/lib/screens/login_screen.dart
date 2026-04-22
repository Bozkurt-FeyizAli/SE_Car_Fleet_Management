import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import 'admin_home_screen.dart';
import 'company_home_screen.dart';
import 'driver_home_screen.dart';
import 'unknown_role_screen.dart';

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

  // Renk paleti — React tasarımıyla uyumlu
  static const _bgColor = Color(0xFF020617); // slate-950
  static const _cardColor = Color(0xFF0F172A); // slate-900
  static const _borderColor = Color(0xFF1E293B); // slate-800
  static const _inputBg = Color(0xFF1E293B); // slate-800
  static const _inputBorder = Color(0xFF334155); // slate-700
  static const _textMuted = Color(0xFF94A3B8); // slate-400
  static const _textPlaceholder = Color(0xFF64748B); // slate-500
  static const _accentBlue = Color(0xFF2563EB); // blue-600
  static const _accentCyan = Color(0xFF22D3EE); // cyan-400

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(
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
      UserModel user;
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      if (email == 'sysadmin' && password == 'sysadmin') {
        user = const UserModel(
          id: '999',
          name: 'Sistem Yöneticisi (Mock)',
          email: 'sysadmin',
          role: UserRole.superAdmin,
          token: 'mock_token_admin',
        );
      } else if (email == 'sirket' && password == 'sirket') {
        user = const UserModel(
          id: '998',
          name: 'Şirket Yöneticisi (Mock)',
          email: 'sirket',
          role: UserRole.company,
          companyId: 1,
          token: 'mock_token_company',
        );
      } else if (email == 'sofor' && password == 'sofor') {
        user = const UserModel(
          id: '997',
          name: 'Şoför (Mock)',
          email: 'sofor',
          role: UserRole.driver,
          companyId: 1,
          token: 'mock_token_driver',
        );
      } else {
        user = await widget.authService.login(email, password);
      }

      if (!mounted) return;

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
        case UserRole.unknown:
          targetScreen = UnknownRoleScreen(authService: widget.authService);
          break;
      }

      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => targetScreen));
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
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
      backgroundColor: _bgColor,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 420),
                decoration: BoxDecoration(
                  color: _cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _borderColor),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 40,
                      offset: const Offset(0, 16),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // ── Dekoratif üst gradient çizgi ──
                      Container(
                        height: 4,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [_accentBlue, _accentCyan],
                          ),
                        ),
                      ),

                      Padding(
                        padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
                        child: Column(
                          children: [
                            // ── Logo ──
                            CircleAvatar(
                              radius: 50,
                              backgroundImage: AssetImage(
                                'assets/images/logo.png',
                              ),
                            ),
                            

                            // ── Başlık ──
                            ShaderMask(
                              shaderCallback: (bounds) => const LinearGradient(
                                colors: [Colors.white, Color(0xFF94A3B8)],
                              ).createShader(bounds),
                              child: const Text(
                                'Fleet Master',
                                style: TextStyle(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // ── Alt başlık ──
                            const Text(
                              'Hesabınıza erişmek için bilgilerinizi girin',
                              style: TextStyle(fontSize: 14, color: _textMuted),
                            ),
                            const SizedBox(height: 28),

                            // ── Form ──
                            Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _buildLabel('E-posta'),
                                  const SizedBox(height: 8),
                                  _buildEmailField(),
                                  const SizedBox(height: 18),
                                  _buildLabel('Şifre'),
                                  const SizedBox(height: 8),
                                  _buildPasswordField(),

                                  // Hata Mesajı
                                  if (_errorMessage != null) ...[
                                    const SizedBox(height: 16),
                                    _buildErrorMessage(),
                                  ],

                                  const SizedBox(height: 24),

                                  // Giriş Butonu
                                  _buildLoginButton(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
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

  // ─────────────────────────────────────────
  //  Label
  // ─────────────────────────────────────────
  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  // ─────────────────────────────────────────
  //  E-posta TextField
  // ─────────────────────────────────────────
  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: _inputDecoration(hintText: 'superadmin@mail.com'),
      validator: (value) {
        if (value == null || value.trim().isEmpty) {
          return 'E-posta adresi veya kullanıcı adı gerekli';
        }
        if (value.trim() == 'sysadmin' || value.trim() == 'sirket' || value.trim() == 'sofor') {
          return null; // Mock girişe izin ver
        }
        if (!value.contains('@')) {
          return 'Geçerli bir e-posta adresi girin';
        }
        return null;
      },
    );
  }

  // ─────────────────────────────────────────
  //  Şifre TextField
  // ─────────────────────────────────────────
  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: _obscurePassword,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: _inputDecoration(hintText: '1234').copyWith(
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            color: _textPlaceholder,
            size: 20,
          ),
          onPressed: () {
            setState(() {
              _obscurePassword = !_obscurePassword;
            });
          },
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

  // ─────────────────────────────────────────
  //  Input Decoration (ortak)
  // ─────────────────────────────────────────
  InputDecoration _inputDecoration({required String hintText}) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(color: _textPlaceholder, fontSize: 14),
      filled: true,
      fillColor: _inputBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _inputBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _inputBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _accentBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.redAccent),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.redAccent, width: 2),
      ),
      errorStyle: const TextStyle(fontSize: 12),
    );
  }

  // ─────────────────────────────────────────
  //  Hata Mesajı
  // ─────────────────────────────────────────
  Widget _buildErrorMessage() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────
  //  Giriş Butonu
  // ─────────────────────────────────────────
  Widget _buildLoginButton() {
    return SizedBox(
      height: 48,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: _accentBlue,
          disabledBackgroundColor: _accentBlue.withOpacity(0.5),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }
}
