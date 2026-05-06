import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'shared_styles.dart';
import 'admin_companies_tab.dart';
import 'admin_users_tab.dart';
import 'sysadmin_vehicles_tab.dart';
import 'sysadmin_locations_tab.dart';

// ─── 9 tabs matching web SystemAdminPanel ────────────────────────────────
const _tabs = [
  (id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard_rounded),
  (id: 'companies', label: 'Şirketler', icon: Icons.business_rounded),
  (id: 'users', label: 'Kullanıcılar', icon: Icons.people_rounded),
  (id: 'vehicles', label: 'Araçlar', icon: Icons.directions_car_rounded),
  (id: 'locations', label: 'Depolar', icon: Icons.warehouse_rounded),
  (id: 'audit', label: 'Denetim', icon: Icons.assignment_rounded),
  (id: 'settings', label: 'Ayarlar', icon: Icons.settings_rounded),
];

// ═══════════════════════════════════════════════════════════════════════════
class AdminHomeScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;
  const AdminHomeScreen({
    super.key,
    required this.user,
    required this.authService,
  });
  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _idx = 0;

  void _logout() => Navigator.of(context).pushReplacement(
    MaterialPageRoute(
      builder: (_) => LoginScreen(authService: widget.authService),
    ),
  );

  String _initials(String n) {
    final p = n.trim().split(' ');
    return p.length >= 2
        ? '${p[0][0]}${p[1][0]}'.toUpperCase()
        : (p.isNotEmpty && p[0].isNotEmpty ? p[0][0].toUpperCase() : 'SA');
  }

  Widget _body() {
    switch (_tabs[_idx].id) {
      case 'companies':
        return const AdminCompaniesTab();
      case 'users':
        return const AdminUsersTab();
      case 'vehicles':
        return SysAdminVehiclesTab(user: widget.user);
      case 'locations':
        return SysAdminLocationsTab(user: widget.user);
      case 'audit':
        return const _AuditTab();
      case 'settings':
        return const _SettingsTab();
      default:
        return _DashboardTab(user: widget.user);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: _appBar(),
      body: _body(),
      bottomNavigationBar: _bottomNav(context),
    );
  }

  PreferredSizeWidget _appBar() => PreferredSize(
    preferredSize: const Size.fromHeight(60),
    child: Container(
      decoration: const BoxDecoration(
        color: kCard,
        border: Border(bottom: BorderSide(color: kBorder)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: kBlue,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.admin_panel_settings_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Sistem Yönetimi',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: kBlue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: Text(
                  _initials(widget.user.name),
                  style: const TextStyle(
                    color: kBlue,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                onPressed: _logout,
                icon: Icon(
                  Icons.logout_rounded,
                  color: Colors.white.withValues(alpha: 0.6),
                  size: 20,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
              ),
            ],
          ),
        ),
      ),
    ),
  );

  Widget _bottomNav(BuildContext context) {
    const double itemWidth = 80.0;
    return Container(
      decoration: const BoxDecoration(
        color: kCard,
        border: Border(top: BorderSide(color: kBorder)),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 62,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final t = _tabs[i];
                final sel = _idx == i;
                return GestureDetector(
                  onTap: () => setState(() => _idx = i),
                  child: Container(
                    width: itemWidth,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    color: Colors.transparent,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(t.icon, size: 22, color: sel ? kBlue : kMuted),
                        const SizedBox(height: 4),
                        Text(
                          t.label,
                          maxLines: 1,
                          overflow: TextOverflow.visible,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10,
                            color: sel ? kBlue : kMuted,
                            fontWeight: sel ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard — System Admin Overview
// ═══════════════════════════════════════════════════════════════════════════
class _DashboardTab extends StatefulWidget {
  final UserModel user;
  const _DashboardTab({required this.user});
  @override
  State<_DashboardTab> createState() => _DashboardState();
}

class _DashboardState extends State<_DashboardTab> {
  final _api = ApiService();
  bool _loading = true;

  List<Map<String, dynamic>> _companies = [];
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _vehicles = [];
  List<Map<String, dynamic>> _drivers = [];
  List<Map<String, dynamic>> _managers = [];
  List<Map<String, dynamic>> _rentals = [];
  List<Map<String, dynamic>> _trips = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getCompanies().catchError((_) => <dynamic>[]),
        _api.getUsers().catchError((_) => <dynamic>[]),
        _api.getVehicles().catchError((_) => <dynamic>[]),
        _api.getDrivers().catchError((_) => <dynamic>[]),
        _api.getManagers().catchError((_) => <dynamic>[]),
        _api.getAllRentals().catchError((_) => <dynamic>[]),
        _api.getAllTrips().catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;
      setState(() {
        _companies = (results[0] as List).cast<Map<String, dynamic>>();
        _users = (results[1] as List).cast<Map<String, dynamic>>();
        _vehicles = (results[2] as List).cast<Map<String, dynamic>>();
        _drivers = (results[3] as List).cast<Map<String, dynamic>>();
        _managers = (results[4] as List).cast<Map<String, dynamic>>();
        _rentals = (results[5] as List).cast<Map<String, dynamic>>();
        _trips = (results[6] as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCompanies = _companies.where((c) => c['status'] == 'active').length;
    final activeV = _vehicles.where((v) => v['isActive'] == true).length;
    final inactiveV = _vehicles.length - activeV;
    final activeRentals = _rentals.where((r) => r['isCompleted'] == false).length;
    final activeTrips = _trips.where((t) => t['status'] != 'Completed').length;
    final completedTrips = _trips.where((t) => t['status'] == 'Completed').length;

    // Driver stats from the Drivers table
    final onTripDrivers = _drivers.where((d) => d['status'] == 'on_trip' || d['status'] == 'On Trip').length;

    return RefreshIndicator(
      onRefresh: _load,
      color: kBlue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hoş geldiniz, ${widget.user.name}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Sistem Genel Bakış',
              style: TextStyle(color: kMuted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: kBlue),
                ),
              )
            else ...[
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.1,
                children: [
                  _stat(
                    Icons.business_rounded,
                    'Şirketler',
                    _companies.length,
                    sub: '$activeCompanies aktif',
                    color: kBlue,
                  ),
                  _stat(
                    Icons.people_rounded,
                    'Kullanıcılar',
                    _users.length,
                    sub: '${_managers.length} yönetici',
                    color: const Color(0xFF7C3AED),
                  ),
                  _stat(
                    Icons.local_shipping_rounded,
                    'Şoförler',
                    _drivers.length,
                    sub: '$onTripDrivers seferde',
                    color: kGreen,
                  ),
                  _stat(
                    Icons.directions_car_rounded,
                    'Araçlar',
                    _vehicles.length,
                    sub: '$activeV aktif · $inactiveV pasif',
                    color: const Color(0xFFD97706),
                  ),
                  _stat(
                    Icons.swap_horiz_rounded,
                    'Kiralamalar',
                    _rentals.length,
                    sub: '$activeRentals aktif kiralama',
                    color: const Color(0xFF0891B2),
                  ),
                  _stat(
                    Icons.map_rounded,
                    'Seferler',
                    _trips.length,
                    sub: '$activeTrips aktif · $completedTrips tamamlanan',
                    color: const Color(0xFFEA580C),
                  ),
                ],
              ),
              const SizedBox(height: 80),
            ],
          ],
        ),
      ),
    );
  }

  Widget _stat(
    IconData icon,
    String label,
    int value, {
    String? sub,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$value',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(color: kMuted, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (sub != null)
                  Text(
                    sub,
                    style: TextStyle(color: color, fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Denetim (Audit Logs) — Mock data, backend API henüz mevcut değil
// ═══════════════════════════════════════════════════════════════════════════
class _AuditTab extends StatefulWidget {
  const _AuditTab();
  @override
  State<_AuditTab> createState() => _AuditTabState();
}

class _AuditTabState extends State<_AuditTab> {
  String _filter = 'Tümü';
  
  static const _logs = [
    {'action': 'LOGIN', 'desc': 'Sistem yöneticisi oturum açtı', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-06 01:30'},
    {'action': 'COMPANY_CREATED', 'desc': 'Furkan Şirket sisteme eklendi', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-05 18:45'},
    {'action': 'USER_CREATED', 'desc': 'Mehmet Başaran kullanıcısı oluşturuldu', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-05 17:20'},
    {'action': 'VEHICLE_UPDATED', 'desc': '07 AA 07 plakalı araç güncellendi', 'user': 'tasiyici@fleet.com', 'ip': '10.0.0.25', 'date': '2026-05-05 16:55'},
    {'action': 'RENTAL_CREATED', 'desc': '35 DP 149 için kiralama talebi oluşturuldu', 'user': 'ikbal@fleet.com', 'ip': '10.0.0.42', 'date': '2026-05-05 15:30'},
    {'action': 'RENTAL_APPROVED', 'desc': '35 DP 149 kiralama talebi onaylandı', 'user': 'tasiyici@fleet.com', 'ip': '10.0.0.25', 'date': '2026-05-05 15:45'},
    {'action': 'USER_UPDATED', 'desc': 'Feyiz Ali Bozkurt kullanıcı bilgileri güncellendi', 'user': 'ikbal@fleet.com', 'ip': '10.0.0.42', 'date': '2026-05-05 14:10'},
    {'action': 'DRIVER_CREATED', 'desc': 'Furkan Şoför şoför kaydı oluşturuldu', 'user': 'tasiyici@fleet.com', 'ip': '10.0.0.25', 'date': '2026-05-05 11:00'},
    {'action': 'LOGIN', 'desc': 'Şirket yöneticisi oturum açtı', 'user': 'tasiyici@fleet.com', 'ip': '10.0.0.25', 'date': '2026-05-05 09:15'},
    {'action': 'VEHICLE_CREATED', 'desc': '37 ab 07 plakalı araç sisteme eklendi', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-04 22:30'},
    {'action': 'COMPANY_UPDATED', 'desc': 'Taşıyıcılar A.Ş bilgileri güncellendi', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-04 20:00'},
    {'action': 'USER_DELETED', 'desc': 'Test kullanıcısı silindi', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-04 18:40'},
    {'action': 'PERMISSION_UPDATED', 'desc': 'Asım Kökçü yönetici yetkileri güncellendi', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-04 17:15'},
    {'action': 'LOGIN', 'desc': 'İkbal Ceyhan oturum açtı', 'user': 'ikbal@fleet.com', 'ip': '10.0.0.42', 'date': '2026-05-04 14:50'},
    {'action': 'RENTAL_RETURNED', 'desc': '41 ZVY 513 kiralama iade edildi', 'user': 'ikbal@fleet.com', 'ip': '10.0.0.42', 'date': '2026-05-04 13:20'},
    {'action': 'VEHICLE_DELETED', 'desc': 'Test aracı sistemden kaldırıldı', 'user': 'admin@fleet.com', 'ip': '192.168.1.10', 'date': '2026-05-03 10:30'},
    {'action': 'LOCATION_CREATED', 'desc': 'İstanbul Ana Depo eklendi', 'user': 'tasiyici@fleet.com', 'ip': '10.0.0.25', 'date': '2026-05-03 09:00'},
    {'action': 'LOGIN_FAILED', 'desc': 'Başarısız giriş denemesi', 'user': 'unknown@test.com', 'ip': '203.0.113.50', 'date': '2026-05-02 23:55'},
  ];

  static const _filterOptions = ['Tümü', 'LOGIN', 'CREATED', 'UPDATED', 'DELETED'];

  Color _color(String? a) {
    if (a == null) return Colors.grey;
    if (a.contains('FAILED')) return Colors.red;
    if (a.contains('DELETED')) return Colors.red;
    if (a.contains('CREATED')) return kBlue;
    if (a.contains('UPDATED') || a.contains('APPROVED')) return Colors.orange;
    if (a.contains('RETURNED')) return const Color(0xFF7C3AED);
    if (a.contains('LOGIN')) return kGreen;
    return Colors.grey;
  }

  IconData _icon(String? a) {
    if (a == null) return Icons.info_outline;
    if (a.contains('LOGIN')) return Icons.login_rounded;
    if (a.contains('COMPANY')) return Icons.business_rounded;
    if (a.contains('USER') || a.contains('DRIVER')) return Icons.person_rounded;
    if (a.contains('VEHICLE')) return Icons.directions_car_rounded;
    if (a.contains('RENTAL')) return Icons.swap_horiz_rounded;
    if (a.contains('PERMISSION')) return Icons.shield_rounded;
    if (a.contains('LOCATION')) return Icons.warehouse_rounded;
    return Icons.info_outline;
  }

  List<Map<String, String>> get _filtered {
    if (_filter == 'Tümü') return _logs;
    return _logs.where((l) => (l['action'] ?? '').contains(_filter)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final logs = _filtered;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
          child: Row(
            children: [
              const Icon(Icons.filter_list_rounded, color: kMuted, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _filterOptions.map((f) {
                      final sel = _filter == f;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(f, style: TextStyle(color: sel ? Colors.white : kMuted, fontSize: 11)),
                          selected: sel,
                          selectedColor: kBlue,
                          backgroundColor: kCard,
                          side: BorderSide(color: sel ? kBlue : kBorder),
                          onSelected: (_) => setState(() => _filter = f),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: logs.isEmpty
              ? const Center(child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 14),
                  itemCount: logs.length,
                  itemBuilder: (_, i) {
                    final l = logs[i];
                    final action = l['action'] ?? '';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: kCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: kBorder),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: _color(action).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Icon(_icon(action), size: 16, color: _color(action)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l['desc'] ?? '',
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    kBadge(action.replaceAll('_', ' '), _color(action)),
                                    const SizedBox(width: 8),
                                    Text(l['date'] ?? '', style: const TextStyle(color: kMuted, fontSize: 10)),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${l['user'] ?? ''} · ${l['ip'] ?? ''}',
                                  style: const TextStyle(color: kMuted, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Ayarlar (Settings) — matches web SettingsTab.tsx
// ═══════════════════════════════════════════════════════════════════════════
class _SettingsTab extends StatefulWidget {
  const _SettingsTab();
  @override
  State<_SettingsTab> createState() => _SettingsState();
}

class _SettingsState extends State<_SettingsTab> {
  final _sysName = TextEditingController(text: 'Filo Yönetim Sistemi');
  final _adminMail = TextEditingController(text: 'admin@fleet.com');
  final _supportMail = TextEditingController(text: 'destek@fleet.com');
  final _sessionMin = TextEditingController(text: '30');
  bool _emailNotif = true, _smsNotif = false, _twoFactor = true;

  @override
  void dispose() {
    _sysName.dispose();
    _adminMail.dispose();
    _supportMail.dispose();
    _sessionMin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Sistem Ayarları',
            style: TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),

          _card(Icons.language_rounded, 'Genel Ayarlar', [
            kField('Sistem Adı', _sysName),
            kField(
              'Admin E-posta',
              _adminMail,
              type: TextInputType.emailAddress,
            ),
            kField(
              'Destek E-posta',
              _supportMail,
              type: TextInputType.emailAddress,
            ),
            kField(
              'Oturum Süresi (dk)',
              _sessionMin,
              type: TextInputType.number,
            ),
            _saveBtn('Genel ayarlar kaydedildi'),
          ]),
          const SizedBox(height: 14),

          _card(Icons.notifications_rounded, 'Bildirim Ayarları', [
            _toggle(
              'E-posta bildirimleri',
              _emailNotif,
              (v) => setState(() => _emailNotif = v),
            ),
            _toggle(
              'SMS bildirimleri',
              _smsNotif,
              (v) => setState(() => _smsNotif = v),
            ),
            _saveBtn('Bildirim ayarları kaydedildi'),
          ]),
          const SizedBox(height: 14),

          _card(Icons.shield_rounded, 'Güvenlik', [
            _toggle(
              'İki faktörlü doğrulama',
              _twoFactor,
              (v) => setState(() => _twoFactor = v),
            ),
            _saveBtn('Güvenlik ayarları kaydedildi'),
          ]),
          const SizedBox(height: 14),

          _card(Icons.storage_rounded, 'Veritabanı', [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kGreen.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kGreen.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.circle, color: Color(0xFF22C55E), size: 8),
                  SizedBox(width: 10),
                  Text(
                    'Veritabanı bağlantısı aktif',
                    style: TextStyle(color: Color(0xFF86EFAC), fontSize: 13),
                  ),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _card(IconData icon, String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: kMuted, size: 16),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _toggle(String label, bool value, ValueChanged<bool> onChange) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(
          children: [
            Switch(value: value, onChanged: onChange, activeThumbColor: kBlue),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
      );

  Widget _saveBtn(String msg) => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: ElevatedButton.icon(
      style: ElevatedButton.styleFrom(backgroundColor: kBlue),
      onPressed: () => kSuccess(context, msg),
      icon: const Icon(Icons.save_rounded, size: 15, color: Colors.white),
      label: const Text('Kaydet', style: TextStyle(color: Colors.white)),
    ),
  );
}
