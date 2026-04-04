import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'shared_styles.dart';

// ─── Driver tabs matching web DriverPanel.tsx ─────────────────────────────
const _kTabDefs = [
  (id: 'profile', label: 'Profilim', icon: Icons.person_rounded),
  (id: 'company', label: 'Şirket', icon: Icons.business_rounded),
  (id: 'vehicle', label: 'Araç', icon: Icons.directions_car_rounded),
  (id: 'trips', label: 'Seferler', icon: Icons.map_rounded),
  (id: 'department', label: 'Departman', icon: Icons.group_rounded),
  (id: 'quick', label: 'Hızlı', icon: Icons.bolt_rounded),
  (id: 'accident', label: 'Kaza', icon: Icons.warning_rounded),
  (id: 'settings', label: 'Ayarlar', icon: Icons.settings_rounded),
];

const _emerald = Color(0xFF059669);

// ══════════════════════════════════════════════════════════════════════════════
class DriverHomeScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;

  const DriverHomeScreen({
    super.key,
    required this.user,
    required this.authService,
  });

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  int _idx = 0;

  void _logout() => Navigator.of(context).pushReplacement(
    MaterialPageRoute(
      builder: (_) => LoginScreen(authService: widget.authService),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: _buildAppBar(),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBody() {
    final id = _kTabDefs[_idx].id;
    switch (id) {
      case 'profile':
        return _ProfileTab(user: widget.user);
      case 'company':
        return _CompanyTab(user: widget.user);
      case 'vehicle':
        return _VehicleTab(user: widget.user);
      case 'trips':
        return const _TripsTab();
      case 'department':
        return const _DepartmentTab();
      case 'quick':
        return const _QuickActionsTab();
      case 'accident':
        return const _AccidentTab();
      case 'settings':
        return _SettingsTab(onLogout: _logout);
      default:
        return const SizedBox.shrink();
    }
  }

  PreferredSizeWidget _buildAppBar() {
    return PreferredSize(
      preferredSize: const Size.fromHeight(64),
      child: Container(
        decoration: BoxDecoration(
          color: kCard,
          border: Border(bottom: BorderSide(color: kBorder, width: 1)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _emerald,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.local_shipping_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Şoför Paneli',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '${widget.user.name} · ${widget.user.email}',
                        style: const TextStyle(color: kMuted, fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _logout,
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.red.withValues(alpha: 0.1),
                    foregroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    minimumSize: Size.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Çıkış Yap',
                    style: TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    final w = MediaQuery.of(context).size.width / _kTabDefs.length;
    return Container(
      decoration: const BoxDecoration(
        color: kCard,
        border: Border(top: BorderSide(color: kBorder)),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 60,
          child: Row(
            children: List.generate(_kTabDefs.length, (i) {
              final tab = _kTabDefs[i];
              final sel = _idx == i;
              return GestureDetector(
                onTap: () => setState(() => _idx = i),
                child: Container(
                  width: w,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  color: Colors.transparent,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(tab.icon, size: 22, color: sel ? _emerald : kMuted),
                      const SizedBox(height: 2),
                      Text(
                        tab.label,
                        style: TextStyle(
                          fontSize: 9,
                          color: sel ? _emerald : kMuted,
                          fontWeight: sel ? FontWeight.w600 : FontWeight.normal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Profile Tab — matches web ProfileTab.tsx
// Fetches live user data from /api/User/{id}
// ══════════════════════════════════════════════════════════════════════════════
class _ProfileTab extends StatefulWidget {
  final UserModel user;
  const _ProfileTab({required this.user});
  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  final _api = ApiService();
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final id = int.tryParse(widget.user.id);
      if (id != null) {
        final data = await _api.getUser(id);
        if (!mounted) return;
        setState(() => _data = data as Map<String, dynamic>?);
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty)
      return parts[0][0].toUpperCase();
    return 'SF';
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.user.name;
    final email = widget.user.email;
    final score = (_data?['driverScore'] as num?)?.toInt() ?? 0;
    final status = _data?['driverTripStatus'] ?? 'active';
    final statusLabel = status == 'active'
        ? 'Aktif'
        : status == 'on_trip'
        ? 'Seferde'
        : 'Pasif';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile card — matches web ProfileTab hero section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: _emerald.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(40),
                    border: Border.all(
                      color: _emerald.withValues(alpha: 0.4),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _initials(name),
                      style: const TextStyle(
                        color: _emerald,
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Sürücü ID: ${widget.user.id}',
                  style: const TextStyle(color: kMuted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    kBadge('Sürücü Skoru: $score', _emerald),
                    kBadge(statusLabel, kBlue),
                    if (_data?['assignedVehicleId'] != null)
                      kBadge('Araç ID: ${_data!['assignedVehicleId']}', kMuted),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Personal info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Kişisel Bilgiler',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                if (_loading)
                  const Center(
                    child: CircularProgressIndicator(color: _emerald),
                  )
                else ...[
                  _infoRow(
                    'TC Kimlik No',
                    (_data?['tcIdentityNumber'] ?? '—').toString(),
                    Icons.badge_outlined,
                  ),
                  _infoRow('E-posta', email, Icons.email_outlined),
                  _infoRow(
                    'Telefon',
                    (_data?['phone'] ?? '—').toString(),
                    Icons.phone_outlined,
                  ),
                  _infoRow(
                    'Sicil Kaydı',
                    (_data?['criminalRecord'] ?? 'Temiz').toString(),
                    Icons.gavel_outlined,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // License info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ehliyet & Yetkinlik',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                if (_loading)
                  const SizedBox.shrink()
                else ...[
                  _infoRow(
                    'Ehliyet No',
                    (_data?['driverLicenseId'] ?? '—').toString(),
                    Icons.credit_card_rounded,
                  ),
                  _infoRow(
                    'Sürücü Puanı',
                    score.toString(),
                    Icons.star_rounded,
                  ),
                  _infoRow(
                    'Bağlı Yönetici ID',
                    (_data?['parentUserId']?.toString() ?? '—'),
                    Icons.person_rounded,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: kMuted, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: kMuted, fontSize: 11),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Company Tab — matches web CompanyTab.tsx
// Fetches assigned company from API
// ══════════════════════════════════════════════════════════════════════════════
class _CompanyTab extends StatefulWidget {
  final UserModel user;
  const _CompanyTab({required this.user});
  @override
  State<_CompanyTab> createState() => _CompanyTabState();
}

class _CompanyTabState extends State<_CompanyTab> {
  final _api = ApiService();
  Map<String, dynamic>? _company;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      // Get user details first to find company
      final id = int.tryParse(widget.user.id);
      if (id != null) {
        final userData = await _api.getUser(id);
        final parentId = (userData as Map<String, dynamic>?)?['parentUserId'];
        if (parentId != null) {
          // Try to fetch all companies and find by matching criteria
          final companies = await _api.getCompanies();
          if (companies.isNotEmpty && mounted) {
            setState(
              () => _company = (companies.first as Map<String, dynamic>),
            );
          }
        } else {
          final companies = await _api.getCompanies();
          if (companies.isNotEmpty && mounted) {
            setState(
              () => _company = (companies.first as Map<String, dynamic>),
            );
          }
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Şirket Bilgileri',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Çalıştığınız şirkete ait bilgiler',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: _emerald))
          else if (_company == null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kBorder),
              ),
              child: const Center(
                child: Text(
                  'Şirket bilgisi bulunamadı.',
                  style: TextStyle(color: kMuted),
                ),
              ),
            )
          else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
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
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: kBlue.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.business_rounded,
                          color: kBlue,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _company!['name'] ?? '—',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            kBadge(
                              kStatusLabel(_company!['status']),
                              kStatusColor(_company!['status']),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _row(
                    'Adres',
                    _company!['address'] ?? '—',
                    Icons.location_on_rounded,
                  ),
                  _row(
                    'Telefon',
                    _company!['phone'] ?? '—',
                    Icons.phone_rounded,
                  ),
                  _row(
                    'E-posta',
                    _company!['email'] ?? '—',
                    Icons.email_rounded,
                  ),
                  _row(
                    'İletişim Kişisi',
                    _company!['contactPerson'] ?? '—',
                    Icons.person_rounded,
                  ),
                  _row(
                    'Website',
                    _company!['website'] ?? '—',
                    Icons.language_rounded,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _row(String label, String value, IconData icon) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        Icon(icon, color: kMuted, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: kMuted, fontSize: 11)),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Vehicle Tab — matches web VehicleTab.tsx
// Fetches assignedVehicleId from user profile, then fetches vehicle details
// ══════════════════════════════════════════════════════════════════════════════
class _VehicleTab extends StatefulWidget {
  final UserModel user;
  const _VehicleTab({required this.user});
  @override
  State<_VehicleTab> createState() => _VehicleTabState();
}

class _VehicleTabState extends State<_VehicleTab> {
  final _api = ApiService();
  Map<String, dynamic>? _vehicle;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final id = int.tryParse(widget.user.id);
      if (id != null) {
        final userData = await _api.getUser(id);
        final vehicleId =
            (userData as Map<String, dynamic>?)?['assignedVehicleId'];
        if (vehicleId != null) {
          final v = await _api.getVehicle(vehicleId);
          if (!mounted) return;
          setState(() => _vehicle = v as Map<String, dynamic>?);
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  String _fmt(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    try {
      return iso.substring(0, 10);
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Araç Bilgileri',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Size atanmış araç bilgileri',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: _emerald))
          else if (_vehicle == null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kBorder),
              ),
              child: const Center(
                child: Text(
                  'Atanmış araç bulunamadı.',
                  style: TextStyle(color: kMuted),
                ),
              ),
            )
          else
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kBorder),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: _emerald.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.directions_car_rounded,
                          color: _emerald,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _vehicle!['plateNumber'] ?? '—',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              _vehicle!['brandModel'] ?? '—',
                              style: const TextStyle(
                                color: kMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      kBadge(
                        _vehicle!['isActive'] == true ? 'Aktif' : 'Pasif',
                        _vehicle!['isActive'] == true ? kGreen : kMuted,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _row('Ruhsat No', _vehicle!['registrationNumber'] ?? '—'),
                  _row('Yıl', (_vehicle!['year'] ?? '—').toString()),
                  _row('Araç Tipi', _vehicle!['vehicleType'] ?? '—'),
                  _row('Kapasite', '${_vehicle!['capacityKg'] ?? 0} kg'),
                  const Divider(color: kBorder, height: 24),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Belgeler',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  _row('Sigorta Bitiş', _fmt(_vehicle!['insuranceEndDate'])),
                  _row('Kasko Bitiş', _fmt(_vehicle!['cascoEndDate'])),
                  _row('Muayene Bitiş', _fmt(_vehicle!['inspectionEndDate'])),
                  _row(
                    'Sonraki Bakım',
                    '${_vehicle!['nextMaintenanceKm'] ?? 0} km',
                  ),
                ],
              ),
            ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: kMuted, fontSize: 12),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Trips Tab — matches web TripsTab.tsx (static placeholder)
// ══════════════════════════════════════════════════════════════════════════════
class _TripsTab extends StatelessWidget {
  const _TripsTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Seferlerim',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Geçmiş ve aktif seferleriniz',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          _statCard(Icons.map_rounded, 'Toplam Sefer', '--', _emerald),
          _statCard(Icons.calendar_month_rounded, 'Bu Ay', '--', kBlue),
          _statCard(
            Icons.speed_rounded,
            'Toplam KM',
            '--',
            const Color(0xFFD97706),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: const Center(
              child: Text(
                'Sefer geçmişi yakında kullanılabilir.',
                style: TextStyle(color: kMuted),
              ),
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _statCard(IconData icon, String label, String value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: kMuted, fontSize: 13),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Department Tab — matches web DepartmentTab.tsx (static)
// ══════════════════════════════════════════════════════════════════════════════
class _DepartmentTab extends StatelessWidget {
  const _DepartmentTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Departman',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Bağlı olduğunuz departman bilgileri',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                _row('Departman Adı', '--', Icons.group_rounded),
                _row('Yönetici', '--', Icons.person_rounded),
                _row('Üye Sayısı', '--', Icons.people_rounded),
              ],
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _row(String label, String value, IconData icon) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(
      children: [
        Icon(icon, color: kMuted, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: kMuted, fontSize: 12),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Quick Actions Tab — matches web QuickActionsTab.tsx
// Sections: Maintenance Request, Report Issue, My Documents, Daily Check
// ══════════════════════════════════════════════════════════════════════════════
class _QuickActionsTab extends StatefulWidget {
  const _QuickActionsTab();
  @override
  State<_QuickActionsTab> createState() => _QuickActionsTabState();
}

class _QuickActionsTabState extends State<_QuickActionsTab> {
  String? _activeSection;

  final _sections = const [
    (
      id: 'maintenance',
      label: 'Bakım Talep Et',
      icon: Icons.build_rounded,
      color: Color(0xFF1D4ED8),
      desc: 'Aracınız için bakım talebi oluşturun',
    ),
    (
      id: 'issue',
      label: 'Sorun Bildir',
      icon: Icons.warning_amber_rounded,
      color: Color(0xFFD97706),
      desc: 'Araçla ilgili sorun bildirin',
    ),
    (
      id: 'documents',
      label: 'Belgelerim',
      icon: Icons.description_rounded,
      color: Color(0xFF7C3AED),
      desc: 'Belgelerinizi görüntüleyin',
    ),
    (
      id: 'daily_check',
      label: 'Günlük Kontrol',
      icon: Icons.checklist_rounded,
      color: Color(0xFF059669),
      desc: 'Günlük araç kontrolü yapın',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    if (_activeSection != null) {
      return Column(
        children: [
          Container(
            color: kBg,
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() => _activeSection = null),
                icon: const Icon(
                  Icons.arrow_back_rounded,
                  size: 18,
                  color: kMuted,
                ),
                label: const Text('Geri', style: TextStyle(color: kMuted)),
              ),
            ),
          ),
          Expanded(child: _buildSection()),
        ],
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Hızlı İşlemler',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: _sections
                .map(
                  (s) => GestureDetector(
                    onTap: () => setState(() => _activeSection = s.id),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: s.color.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: s.color.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: s.color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(s.icon, color: s.color, size: 22),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            s.label,
                            style: TextStyle(
                              color: s.color,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            s.desc,
                            style: const TextStyle(color: kMuted, fontSize: 10),
                            maxLines: 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildSection() {
    switch (_activeSection) {
      case 'maintenance':
        return const _MaintenanceSection();
      case 'issue':
        return const _IssueSection();
      case 'documents':
        return const _DocumentsSection();
      case 'daily_check':
        return const _DailyCheckSection();
      default:
        return const SizedBox.shrink();
    }
  }
}

// ─── Maintenance Request section ──────────────────────────────────────────
class _MaintenanceSection extends StatefulWidget {
  const _MaintenanceSection();
  @override
  State<_MaintenanceSection> createState() => _MaintenanceSectionState();
}

class _MaintenanceSectionState extends State<_MaintenanceSection> {
  final List<Map<String, dynamic>> _requests = [];
  String _type = 'Periyodik Bakım';
  String _urgency = 'medium';
  final _desc = TextEditingController();

  final _types = [
    'Periyodik Bakım',
    'Lastik Değişimi',
    'Fren Bakımı',
    'Motor Bakımı',
    'Yağ Değişimi',
    'Diğer',
  ];

  @override
  void dispose() {
    _desc.dispose();
    super.dispose();
  }

  void _submit() {
    if (_desc.text.isEmpty) {
      kError(context, 'Açıklama girin');
      return;
    }
    setState(() {
      _requests.insert(0, {
        'date': DateTime.now().toIso8601String().substring(0, 10),
        'type': _type,
        'urgency': _urgency,
        'desc': _desc.text,
        'status': 'pending',
      });
      _desc.clear();
    });
    kSuccess(context, 'Bakım talebi gönderildi');
  }

  String _urgencyLabel(String u) => u == 'high'
      ? 'Yüksek'
      : u == 'medium'
      ? 'Orta'
      : 'Düşük';
  Color _urgencyColor(String u) => u == 'high'
      ? Colors.red
      : u == 'medium'
      ? Colors.orange
      : kGreen;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.build_rounded, color: kBlue, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Yeni Bakım Talebi',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                kLabel('Bakım Tipi'),
                kDropdown(
                  _type,
                  _types,
                  _types,
                  (v) => setState(() => _type = v!),
                ),
                kLabel('Aciliyet'),
                kDropdown(
                  _urgency,
                  ['low', 'medium', 'high'],
                  ['Düşük', 'Orta', 'Yüksek'],
                  (v) => setState(() => _urgency = v!),
                ),
                kField('Açıklama *', _desc),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: kBlue),
                    onPressed: _submit,
                    icon: const Icon(
                      Icons.send_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Talep Gönder',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_requests.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Geçmiş Taleplerim',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            ..._requests.map(
              (r) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            r['type'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        kBadge(
                          _urgencyLabel(r['urgency']),
                          _urgencyColor(r['urgency']),
                        ),
                        const SizedBox(width: 6),
                        kBadge('Beklemede', Colors.orange),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      r['desc'],
                      style: const TextStyle(color: kMuted, fontSize: 12),
                    ),
                    Text(
                      r['date'],
                      style: const TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

// ─── Issue Report section ─────────────────────────────────────────────────
class _IssueSection extends StatefulWidget {
  const _IssueSection();
  @override
  State<_IssueSection> createState() => _IssueSectionState();
}

class _IssueSectionState extends State<_IssueSection> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _priority = 'medium';

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFD97706),
                  size: 18,
                ),
                SizedBox(width: 8),
                Text(
                  'Sorun Bildir',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            kField('Sorun Başlığı', _title, hint: 'Sorunun kısa açıklaması'),
            kLabel('Öncelik'),
            kDropdown(
              _priority,
              ['low', 'medium', 'high'],
              ['Düşük', 'Orta', 'Yüksek'],
              (v) => setState(() => _priority = v!),
            ),
            kField(
              'Detaylı Açıklama',
              _desc,
              hint: 'Sorunu detaylı açıklayın...',
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
                ),
                onPressed: () {
                  if (_title.text.isEmpty) {
                    kError(context, 'Başlık girin');
                    return;
                  }
                  _title.clear();
                  _desc.clear();
                  kSuccess(context, 'Sorun bildirimi gönderildi');
                },
                icon: const Icon(
                  Icons.send_rounded,
                  size: 16,
                  color: Colors.white,
                ),
                label: const Text(
                  'Bildir',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Documents section ────────────────────────────────────────────────────
class _DocumentsSection extends StatelessWidget {
  const _DocumentsSection();

  @override
  Widget build(BuildContext context) {
    final docs = [
      {
        'name': 'Ehliyet',
        'type': 'Sürücü Belgesi',
        'expiry': '2027-05-15',
        'status': 'valid',
      },
      {
        'name': 'SRC Belgesi',
        'type': 'Mesleki Yeterlilik',
        'expiry': '2027-12-01',
        'status': 'valid',
      },
      {
        'name': 'Psikoteknik Raporu',
        'type': 'Sağlık Belgesi',
        'expiry': '2026-06-15',
        'status': 'expiring',
      },
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Belgelerim',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...docs.map(
            (d) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kBorder),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.description_rounded,
                    color: kMuted,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          d['name']!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          d['type']!,
                          style: const TextStyle(color: kMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Geçerlilik: ${d['expiry']}',
                        style: const TextStyle(color: kMuted, fontSize: 10),
                      ),
                      const SizedBox(height: 4),
                      kBadge(
                        d['status'] == 'valid'
                            ? 'Geçerli'
                            : 'Süresi Yaklaşıyor',
                        d['status'] == 'valid' ? kGreen : Colors.orange,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

// ─── Daily Check section ──────────────────────────────────────────────────
class _DailyCheckSection extends StatefulWidget {
  const _DailyCheckSection();
  @override
  State<_DailyCheckSection> createState() => _DailyCheckSectionState();
}

class _DailyCheckSectionState extends State<_DailyCheckSection> {
  String _tire = 'good', _brake = 'good', _light = 'good', _oil = 'good';
  final _fuel = TextEditingController(text: '100');
  final _km = TextEditingController();
  final _notes = TextEditingController();
  final List<Map<String, dynamic>> _history = [];

  @override
  void dispose() {
    _fuel.dispose();
    _km.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _submit() {
    if (_km.text.isEmpty) {
      kError(context, 'Kilometre bilgisini girin');
      return;
    }
    setState(
      () => _history.insert(0, {
        'date': DateTime.now().toIso8601String().substring(0, 10),
        'tire': _tire,
        'brake': _brake,
        'light': _light,
        'oil': _oil,
        'fuel': _fuel.text,
        'km': _km.text,
        'notes': _notes.text,
      }),
    );
    _km.clear();
    _notes.clear();
    kSuccess(context, 'Günlük kontrol kaydedildi');
  }

  String _cLabel(String c) => c == 'good'
      ? 'İyi'
      : c == 'fair'
      ? 'Orta'
      : 'Kötü';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.checklist_rounded, color: kGreen, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Günlük Araç Kontrolü',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Yola çıkmadan önce araç kontrolünüzü yapın',
                  style: TextStyle(color: kMuted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                kLabel('Lastik Durumu'),
                kDropdown(
                  _tire,
                  ['good', 'fair', 'poor'],
                  ['İyi', 'Orta', 'Kötü'],
                  (v) => setState(() => _tire = v!),
                ),
                kLabel('Fren Durumu'),
                kDropdown(
                  _brake,
                  ['good', 'fair', 'poor'],
                  ['İyi', 'Orta', 'Kötü'],
                  (v) => setState(() => _brake = v!),
                ),
                kLabel('Işık Durumu'),
                kDropdown(
                  _light,
                  ['good', 'fair', 'poor'],
                  ['İyi', 'Orta', 'Kötü'],
                  (v) => setState(() => _light = v!),
                ),
                kLabel('Yağ Seviyesi'),
                kDropdown(
                  _oil,
                  ['good', 'fair', 'poor'],
                  ['İyi', 'Orta', 'Kötü'],
                  (v) => setState(() => _oil = v!),
                ),
                kField('Yakıt Seviyesi (%)', _fuel, type: TextInputType.number),
                kField('Kilometre *', _km, type: TextInputType.number),
                kField('Notlar', _notes),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: kGreen),
                    onPressed: _submit,
                    icon: const Icon(
                      Icons.check_circle_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Kontrolü Kaydet',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_history.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Geçmiş Kontrollerim',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            ..._history.map(
              (h) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          h['date'],
                          style: const TextStyle(color: kMuted, fontSize: 11),
                        ),
                        const Spacer(),
                        Text(
                          '${h['km']} km',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      children: [
                        kBadge('Lastik: ${_cLabel(h['tire'])}', kGreen),
                        kBadge('Fren: ${_cLabel(h['brake'])}', kBlue),
                        kBadge('Yakıt: ${h['fuel']}%', const Color(0xFFD97706)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Accident Tab — matches web AccidentReportTab.tsx (fully functional form)
// ══════════════════════════════════════════════════════════════════════════════
class _AccidentTab extends StatefulWidget {
  const _AccidentTab();
  @override
  State<_AccidentTab> createState() => _AccidentTabState();
}

class _AccidentTabState extends State<_AccidentTab> {
  final _location = TextEditingController();
  final _desc = TextEditingController();
  String _severity = 'minor';
  String _date = DateTime.now().toIso8601String().substring(0, 10);
  final List<Map<String, dynamic>> _reports = [];

  @override
  void dispose() {
    _location.dispose();
    _desc.dispose();
    super.dispose();
  }

  void _submit() {
    if (_desc.text.isEmpty || _location.text.isEmpty) {
      kError(context, 'Lütfen açıklama ve konum bilgilerini girin');
      return;
    }
    setState(
      () => _reports.insert(0, {
        'date': _date,
        'location': _location.text,
        'severity': _severity,
        'desc': _desc.text,
        'status': 'Bildirildi',
      }),
    );
    _location.clear();
    _desc.clear();
    kSuccess(context, 'Kaza bildirimi başarıyla gönderildi');
  }

  String _sevLabel(String s) => s == 'major'
      ? 'Ağır'
      : s == 'moderate'
      ? 'Orta'
      : 'Hafif';
  Color _sevColor(String s) => s == 'major'
      ? Colors.red
      : s == 'moderate'
      ? Colors.orange
      : kGreen;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Warning banner - matches web
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.warning_rounded, color: Colors.orange, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Acil bir durum varsa önce 112\'yi arayın.',
                    style: TextStyle(color: Colors.orange, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.warning_rounded, color: Colors.red, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Yeni Kaza Bildirimi',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Kaza durumunda aşağıdaki formu doldurarak bildirim yapın',
                  style: TextStyle(color: kMuted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                // Date field
                kLabel('Tarih'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TextFormField(
                    initialValue: _date,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: fieldDecor('Tarih (YYYY-MM-DD)'),
                    onChanged: (v) => _date = v,
                  ),
                ),
                kField(
                  'Konum *',
                  _location,
                  hint: 'Örneğin: İstanbul - Ankara otoyolu, 150. km',
                ),
                kLabel('Şiddet'),
                kDropdown(
                  _severity,
                  ['minor', 'moderate', 'major'],
                  ['Hafif', 'Orta', 'Ağır'],
                  (v) => setState(() => _severity = v!),
                ),
                kField(
                  'Açıklama *',
                  _desc,
                  hint: 'Kaza ile ilgili detaylı açıklama yazın...',
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    onPressed: _submit,
                    icon: const Icon(
                      Icons.warning_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Kaza Bildir',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_reports.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Geçmiş Bildirimlerim',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            ..._reports.map(
              (r) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            r['location'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        kBadge(
                          _sevLabel(r['severity']),
                          _sevColor(r['severity']),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      r['desc'],
                      style: const TextStyle(color: kMuted, fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      r['date'],
                      style: const TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Settings Tab — matches web driver/tabs/SettingsTab.tsx
// ══════════════════════════════════════════════════════════════════════════════
class _SettingsTab extends StatefulWidget {
  final VoidCallback onLogout;
  const _SettingsTab({required this.onLogout});
  @override
  State<_SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<_SettingsTab> {
  bool _notifications = true;
  bool _locationSharing = true;
  bool _darkMode = true;
  String _language = 'tr';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ayarlar',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),

          _card(Icons.notifications_rounded, 'Bildirim Ayarları', [
            _toggle(
              'Uygulama bildirimleri',
              _notifications,
              (v) => setState(() => _notifications = v),
            ),
            _toggle(
              'Konum paylaşımı',
              _locationSharing,
              (v) => setState(() => _locationSharing = v),
            ),
          ]),
          const SizedBox(height: 14),

          _card(Icons.palette_rounded, 'Görünüm', [
            _toggle(
              'Koyu mod',
              _darkMode,
              (v) => setState(() => _darkMode = v),
            ),
            kLabel('Dil'),
            kDropdown(
              _language,
              ['tr', 'en'],
              ['Türkçe', 'English'],
              (v) => setState(() => _language = v!),
            ),
          ]),
          const SizedBox(height: 14),

          _card(Icons.info_rounded, 'Uygulama Hakkında', [
            _infoRow('Versiyon', '1.0.0'),
            _infoRow('Geliştirici', 'SE Fleet Management'),
          ]),
          const SizedBox(height: 14),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: widget.onLogout,
              icon: const Icon(
                Icons.logout_rounded,
                size: 18,
                color: Colors.white,
              ),
              label: const Text(
                'Çıkış Yap',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _card(IconData icon, String title, List<Widget> children) => Container(
    padding: const EdgeInsets.all(14),
    margin: EdgeInsets.zero,
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

  Widget _toggle(String label, bool value, ValueChanged<bool> onChange) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          children: [
            Switch(value: value, onChanged: onChange, activeColor: _emerald),
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

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: kMuted, fontSize: 13),
          ),
        ),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13)),
      ],
    ),
  );
}
