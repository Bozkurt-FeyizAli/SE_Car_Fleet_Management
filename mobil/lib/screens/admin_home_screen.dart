import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'shared_styles.dart';
import 'admin_companies_tab.dart';
import 'admin_users_tab.dart';
import 'admin_drivers_tab.dart';
import 'admin_vehicles_tab.dart';
import 'admin_rentals_tab.dart';

// ─── 8 tabs matching web SystemAdminPanel ────────────────────────────────
const _tabs = [
  (id: 'dashboard', label: 'Dashboard',    icon: Icons.dashboard_rounded),
  (id: 'companies', label: 'Şirketler',   icon: Icons.business_rounded),
  (id: 'users',     label: 'Kullanıcılar',icon: Icons.people_rounded),
  (id: 'drivers',   label: 'Şoförler',    icon: Icons.local_shipping_rounded),
  (id: 'vehicles',  label: 'Araçlar',     icon: Icons.directions_car_rounded),
  (id: 'rentals',   label: 'Kiralık',     icon: Icons.swap_horiz_rounded),
  (id: 'audit',     label: 'Denetim',     icon: Icons.assignment_rounded),
  (id: 'settings',  label: 'Ayarlar',     icon: Icons.settings_rounded),
];

// ═══════════════════════════════════════════════════════════════════════════
class AdminHomeScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;
  const AdminHomeScreen({super.key, required this.user, required this.authService});
  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _idx = 0;

  void _logout() => Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(authService: widget.authService)));

  String _initials(String n) {
    final p = n.trim().split(' ');
    return p.length >= 2
        ? '${p[0][0]}${p[1][0]}'.toUpperCase()
        : (p.isNotEmpty && p[0].isNotEmpty ? p[0][0].toUpperCase() : 'SA');
  }

  Widget _body() {
    switch (_tabs[_idx].id) {
      case 'companies': return const AdminCompaniesTab();
      case 'users':     return const AdminUsersTab();
      case 'drivers':   return const AdminDriversTab();
      case 'vehicles':  return const AdminVehiclesTab();
      case 'rentals':   return const AdminRentalsTab();
      case 'audit':     return const _AuditTab();
      case 'settings':  return const _SettingsTab();
      default:          return _DashboardTab(user: widget.user);
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
          color: kCard, border: Border(bottom: BorderSide(color: kBorder))),
      child: SafeArea(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Row(children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(color: kBlue, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.admin_panel_settings_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 10),
          const Expanded(child: Text('Sistem Yönetimi',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700))),
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
                color: kBlue.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16)),
            alignment: Alignment.center,
            child: Text(_initials(widget.user.name),
                style: const TextStyle(color: kBlue, fontSize: 12, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 6),
          IconButton(
            onPressed: _logout,
            icon: Icon(Icons.logout_rounded, color: Colors.white.withValues(alpha: 0.6), size: 20),
            padding: EdgeInsets.zero, constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
          ),
        ]),
      )),
    ),
  );

  Widget _bottomNav(BuildContext context) {
    final w = MediaQuery.of(context).size.width / _tabs.length;
    return Container(
      decoration: const BoxDecoration(
          color: kCard, border: Border(top: BorderSide(color: kBorder))),
      child: SafeArea(
        child: SizedBox(
          height: 58,
          child: Row(
            children: List.generate(_tabs.length, (i) {
              final t = _tabs[i];
              final sel = _idx == i;
              return GestureDetector(
                onTap: () => setState(() => _idx = i),
                child: Container(
                  width: w,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  color: Colors.transparent,
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(t.icon, size: 21, color: sel ? kBlue : kMuted),
                    const SizedBox(height: 2),
                    Text(t.label,
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 9,
                            color: sel ? kBlue : kMuted,
                            fontWeight: sel ? FontWeight.w600 : FontWeight.normal)),
                  ]),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard — matches web DashboardTab.tsx
// ═══════════════════════════════════════════════════════════════════════════
class _DashboardTab extends StatefulWidget {
  final UserModel user;
  const _DashboardTab({required this.user});
  @override
  State<_DashboardTab> createState() => _DashboardState();
}

class _DashboardState extends State<_DashboardTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _companies = [], _users = [], _vehicles = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getCompanies(), _api.getUsers(), _api.getVehicles()
      ]);
      if (!mounted) return;
      setState(() {
        _companies = results[0].cast();
        _users     = results[1].cast();
        _vehicles  = results[2].cast();
        _loading   = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final activeCompanies = _companies.where((c) => c['status'] == 'active').length;
    final drivers  = _users.where((u) => (u['roleId'] as num?)?.toInt() == 3).toList();
    final activeD  = drivers.where((d) => d['driverTripStatus'] != 'inactive').length;
    final activeV  = _vehicles.where((v) => v['isActive'] == true).length;
    final scores   = drivers.map((d) => (d['driverScore'] as num?)?.toInt() ?? 0);
    final avgScore = drivers.isEmpty ? 0.0
        : scores.reduce((a, b) => a + b) / drivers.length;

    return RefreshIndicator(
      onRefresh: _load,
      color: kBlue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Hoş geldiniz, ${widget.user.name}',
              style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Sistem Genel Bakış', style: TextStyle(color: kMuted, fontSize: 13)),
          const SizedBox(height: 14),
          if (_loading)
            const Center(child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: kBlue)))
          else ...[
            GridView.count(
              crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.6,
              children: [
                _stat(Icons.business_rounded,        'Aktif Şirketler',    activeCompanies,
                    sub: '${_companies.length} toplam', color: kBlue),
                _stat(Icons.people_rounded,           'Toplam Kullanıcı',  _users.length,
                    sub: '${drivers.length} şoför', color: const Color(0xFF7C3AED)),
                _stat(Icons.local_shipping_rounded,   'Aktif Şoförler',    activeD,
                    sub: 'Ort. ${avgScore.toStringAsFixed(1)} puan',color: kGreen),
                _stat(Icons.directions_car_rounded,   'Aktif Araçlar',     activeV,
                    sub: '${_vehicles.length} toplam', color: const Color(0xFFD97706)),
              ],
            ),
            const SizedBox(height: 18),
            const Text('Şirket Durumu',
                style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            if (_companies.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: kBorder)),
                child: const Center(child: Text('Şirket kaydı yok.', style: TextStyle(color: kMuted))),
              )
            else
              Column(
                children: _companies.map((c) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: kBorder)),
                  child: Row(children: [
                    Expanded(child: Text(c['name'] ?? '—',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13))),
                    kBadge(kStatusLabel(c['status']), kStatusColor(c['status'])),
                  ]),
                )).toList(),
              ),
            const SizedBox(height: 80),
          ],
        ]),
      ),
    );
  }

  Widget _stat(IconData icon, String label, int value,
      {String? sub, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10),
          border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Icon(icon, color: color, size: 22),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('$value',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(color: kMuted, fontSize: 11)),
          if (sub != null)
            Text(sub, style: TextStyle(color: color, fontSize: 10)),
        ]),
      ]),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Denetim (Audit Logs) — read-only, matches web AuditLogsTab.tsx
// ═══════════════════════════════════════════════════════════════════════════
class _AuditTab extends StatelessWidget {
  const _AuditTab();

  static const _logs = [
    {'action': 'COMPANY_CREATED',   'desc': 'Yeni şirket sisteme eklendi',       'user': 'admin@fleet.com', 'date': '2026-03-18 02:30'},
    {'action': 'USER_CREATED',      'desc': 'Yeni kullanıcı oluşturuldu',         'user': 'admin@fleet.com', 'date': '2026-03-17 18:15'},
    {'action': 'VEHICLE_UPDATED',   'desc': 'Araç bilgileri güncellendi',         'user': 'admin@fleet.com', 'date': '2026-03-17 15:40'},
    {'action': 'DRIVER_CREATED',    'desc': 'Yeni şoför sisteme eklendi',         'user': 'admin@fleet.com', 'date': '2026-03-16 11:20'},
    {'action': 'RENTAL_CREATED',    'desc': 'Kiralama kaydı oluşturuldu',         'user': 'admin@fleet.com', 'date': '2026-03-15 09:00'},
    {'action': 'LOGIN',             'desc': 'Kullanıcı oturum açtı',              'user': 'admin@fleet.com', 'date': '2026-03-18 00:05'},
    {'action': 'COMPANY_UPDATED',   'desc': 'Şirket bilgileri güncellendi',       'user': 'admin@fleet.com', 'date': '2026-03-14 16:30'},
  ];

  Color _color(String? a) {
    if (a == null) return Colors.grey;
    if (a.contains('CREATED')) return kBlue;
    if (a.contains('UPDATED')) return Colors.orange;
    if (a.contains('DELETED')) return Colors.red;
    if (a.contains('LOGIN'))   return kGreen;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: _logs.length,
      itemBuilder: (_, i) {
        final l = _logs[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: kBorder)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Container(width: 8, height: 8,
                  decoration: BoxDecoration(color: _color(l['action']),
                      borderRadius: BorderRadius.circular(4))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(l['desc'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 13)),
              const SizedBox(height: 4),
              Row(children: [
                kBadge((l['action'] ?? '').replaceAll('_', ' '), _color(l['action'])),
                const SizedBox(width: 8),
                Text(l['date'] ?? '', style: const TextStyle(color: kMuted, fontSize: 11)),
              ]),
              const SizedBox(height: 2),
              Text(l['user'] ?? '', style: const TextStyle(color: kMuted, fontSize: 11)),
            ])),
          ]),
        );
      },
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
  final _sysName    = TextEditingController(text: 'Filo Yönetim Sistemi');
  final _adminMail  = TextEditingController(text: 'admin@fleet.com');
  final _supportMail= TextEditingController(text: 'destek@fleet.com');
  final _sessionMin = TextEditingController(text: '30');
  bool _emailNotif = true, _smsNotif = false, _twoFactor = true;

  @override
  void dispose() {
    _sysName.dispose(); _adminMail.dispose();
    _supportMail.dispose(); _sessionMin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Sistem Ayarları',
            style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),

        _card(Icons.language_rounded, 'Genel Ayarlar', [
          kField('Sistem Adı',      _sysName),
          kField('Admin E-posta',   _adminMail,   type: TextInputType.emailAddress),
          kField('Destek E-posta',  _supportMail, type: TextInputType.emailAddress),
          kField('Oturum Süresi (dk)', _sessionMin, type: TextInputType.number),
          _saveBtn('Genel ayarlar kaydedildi'),
        ]),
        const SizedBox(height: 14),

        _card(Icons.notifications_rounded, 'Bildirim Ayarları', [
          _toggle('E-posta bildirimleri', _emailNotif, (v) => setState(() => _emailNotif = v)),
          _toggle('SMS bildirimleri',     _smsNotif,   (v) => setState(() => _smsNotif = v)),
          _saveBtn('Bildirim ayarları kaydedildi'),
        ]),
        const SizedBox(height: 14),

        _card(Icons.shield_rounded, 'Güvenlik', [
          _toggle('İki faktörlü doğrulama', _twoFactor, (v) => setState(() => _twoFactor = v)),
          _saveBtn('Güvenlik ayarları kaydedildi'),
        ]),
        const SizedBox(height: 14),

        _card(Icons.storage_rounded, 'Veritabanı', [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: kGreen.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: kGreen.withValues(alpha: 0.3))),
            child: const Row(children: [
              Icon(Icons.circle, color: Color(0xFF22C55E), size: 8),
              SizedBox(width: 10),
              Text('Veritabanı bağlantısı aktif',
                  style: TextStyle(color: Color(0xFF86EFAC), fontSize: 13)),
            ]),
          ),
        ]),
        const SizedBox(height: 80),
      ]),
    );
  }

  Widget _card(IconData icon, String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: kMuted, size: 16),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
        ]),
        const SizedBox(height: 12),
        ...children,
      ]),
    );
  }

  Widget _toggle(String label, bool value, ValueChanged<bool> onChange) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(children: [
      Switch(value: value, onChanged: onChange, activeColor: kBlue),
      const SizedBox(width: 8),
      Expanded(child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 13))),
    ]),
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
