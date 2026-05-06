import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'shared_styles.dart';
import 'admin_drivers_tab.dart';
import 'admin_vehicles_tab.dart';
import 'admin_rentals_tab.dart';
import 'admin_locations_tab.dart';
import 'admin_trips_tab.dart';
import 'admin_payments_tab.dart';
import 'company_users_tab.dart';
import 'company_departments_tab.dart';

// ─── Base Tabs Definition ─────────────────────────────────────
// The visible tabs will be generated dynamically based on permissions
typedef TabInfo = ({String id, String label, IconData icon});

// ═══════════════════════════════════════════════════════════════════════════
class CompanyHomeScreen extends StatefulWidget {
  final UserModel user;
  final AuthService authService;
  const CompanyHomeScreen({
    super.key,
    required this.user,
    required this.authService,
  });
  @override
  State<CompanyHomeScreen> createState() => _State();
}

class _State extends State<CompanyHomeScreen> {
  int _idx = 0;
  bool _loadingPerms = true;
  Set<int> _myPerms = {};
  List<TabInfo> _activeTabs = [];

  @override
  void initState() {
    super.initState();
    _loadPerms();
  }

  Future<void> _loadPerms() async {
    if (widget.user.role == UserRole.superAdmin) {
      _myPerms = {1, 2, 3}; // Admin has all perms
    } else {
      try {
        final api = ApiService();
        final managers = await api.getManagers();
        final myId = int.tryParse(widget.user.id);
        final myManager = managers.cast<Map<String, dynamic>>().firstWhere(
          (m) => m['userId'] == myId,
          orElse: () => <String, dynamic>{},
        );
        
        if (myManager.isNotEmpty) {
          final mId = (myManager['id'] as num).toInt();
          final mPerms = await api.getManagerPermissionLinks();
          final perms = mPerms
              .cast<Map<String, dynamic>>()
              .where((p) => p['managerId'] == mId)
              .map((p) => (p['permissionId'] as num).toInt())
              .toSet();
          _myPerms = perms;
        }
      } catch (_) {}
    }
    
    _generateTabs();
    if (mounted) setState(() => _loadingPerms = false);
  }

  void _generateTabs() {
    final List<TabInfo> tabs = [
      (id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard_rounded),
      (id: 'users', label: 'Yöneticiler', icon: Icons.manage_accounts_rounded),
      (id: 'departments', label: 'Departmanlar', icon: Icons.folder_rounded),
      (id: 'drivers', label: 'Şoförler', icon: Icons.local_shipping_rounded),
      (id: 'vehicles', label: 'Araçlar', icon: Icons.directions_car_rounded),
    ];

    if (_myPerms.contains(3) || widget.user.role == UserRole.superAdmin) {
      tabs.add((id: 'rentals', label: 'Kiralık', icon: Icons.swap_horiz_rounded));
    }

    if (_myPerms.contains(2) || widget.user.role == UserRole.superAdmin) {
      tabs.add((id: 'payments', label: 'Ödemeler', icon: Icons.payment_rounded));
    }

    tabs.addAll([
      (id: 'locations', label: 'Depolar', icon: Icons.warehouse_rounded),
      (id: 'trips', label: 'Seferler', icon: Icons.map_rounded),
      (id: 'settings', label: 'Ayarlar', icon: Icons.settings_rounded),
    ]);

    _activeTabs = tabs;
  }

  void _logout() => Navigator.of(context).pushReplacement(
    MaterialPageRoute(
      builder: (_) => LoginScreen(authService: widget.authService),
    ),
  );

  String _initials(String n) {
    final p = n.trim().split(' ');
    return p.length >= 2
        ? '${p[0][0]}${p[1][0]}'.toUpperCase()
        : (p.isNotEmpty && p[0].isNotEmpty ? p[0][0].toUpperCase() : 'YN');
  }

  Widget _body() {
    if (_loadingPerms) {
      return const Center(child: CircularProgressIndicator(color: kBlue));
    }
    
    if (_idx >= _activeTabs.length) _idx = 0;
    
    switch (_activeTabs[_idx].id) {
      case 'users':
        return CompanyUsersTab(companyId: widget.user.companyId);
      case 'departments':
        return CompanyDepartmentsTab(companyId: widget.user.companyId);
      case 'drivers':
        return AdminDriversTab(companyId: widget.user.companyId);
      case 'vehicles':
        return AdminVehiclesTab(
          user: widget.user, 
          hasVehiclePerm: _myPerms.contains(1) || widget.user.role == UserRole.superAdmin
        );
      case 'rentals':
        return AdminRentalsTab(user: widget.user);
      case 'payments':
        return const AdminPaymentsTab();
      case 'locations':
        return AdminLocationsTab(user: widget.user);
      case 'trips':
        return AdminTripsTab(user: widget.user);
      case 'settings':
        return const _CompanySettingsTab();
      default:
        return _CompanyDashboard(user: widget.user);
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
                  Icons.manage_accounts_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Yönetici Paneli',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      widget.user.name,
                      style: const TextStyle(color: kMuted, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
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
              children: List.generate(_activeTabs.length, (i) {
                final t = _activeTabs[i];
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
                            fontWeight: sel
                                ? FontWeight.w600
                                : FontWeight.normal,
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
// Dashboard — matches web manager/tabs/DashboardTab.tsx
// ═══════════════════════════════════════════════════════════════════════════
class _CompanyDashboard extends StatefulWidget {
  final UserModel user;
  const _CompanyDashboard({required this.user});
  @override
  State<_CompanyDashboard> createState() => _DashState();
}

class _DashState extends State<_CompanyDashboard> {
  final _api = ApiService();
  List<Map<String, dynamic>> _drivers = [],
      _vehicles = [],
      _rentals = [],
      _trips = [],
      _managers = [];
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
      final results = await Future.wait([
        _api.getUsers(),
        _api.getVehicles(),
        _api.getCompanies(),
        _api.getAllRentals(),
        _api.getDrivers(),
        _api.getAllTrips(),
        _api.getManagers(),
      ]);
      if (!mounted) return;
      final allUsers = results[0].cast<Map<String, dynamic>>();
      final allVehicles = results[1].cast<Map<String, dynamic>>();
      final companies = results[2].cast<Map<String, dynamic>>();
      final allRentals = results[3].cast<Map<String, dynamic>>();
      final allDrivers = results[4].cast<Map<String, dynamic>>();
      final allTrips = results[5].cast<Map<String, dynamic>>();
      final allManagers = results[6].cast<Map<String, dynamic>>();

      final uCid = widget.user.companyId;

      // Combine driver + user data, filter by company
      final combinedDrivers = allDrivers
          .map((driver) {
            final userId = driver['userId'];
            final user = allUsers.firstWhere(
              (u) => u['id'] == userId,
              orElse: () => <String, dynamic>{},
            );
            return {
              ...user,
              ...driver,
              'id': user['id'] ?? driver['userId'],
              'driverId': driver['id'],
            };
          })
          .where((d) => uCid == null || d['companyId'] == uCid)
          .toList();

      // Company vehicles + rented-in vehicles
      final processedVehicles = <Map<String, dynamic>>[];
      for (var v in allVehicles) {
        final plate = v['plate'] ?? v['plateNumber'];
        final activeRental = allRentals.where(
          (r) => r['vehiclePlate'] == plate && r['isCompleted'] == false,
        );
        bool isRentedIn =
            activeRental.isNotEmpty &&
            activeRental.first['renterCompanyId'] == uCid;
        if (uCid == null || v['companyId'] == uCid || isRentedIn) {
          processedVehicles.add(v);
        }
      }

      // Company's driver IDs for trip filtering
      final companyDriverIds = combinedDrivers
          .map((d) => d['driverId'])
          .toSet();
      final companyTrips = allTrips
          .where((t) => companyDriverIds.contains(t['driverId']))
          .toList();

      // All managers (role=1) working at this company
      final companyManagers = allUsers.where((u) {
        final cid = (u['companyId'] as num?)?.toInt();
        final r = (u['role'] as num?)?.toInt() ?? (u['roleId'] as num?)?.toInt();
        return (uCid == null || cid == uCid) && r == 1;
      }).toList();

      setState(() {
        _drivers = combinedDrivers;
        _vehicles = processedVehicles;
        _rentals = allRentals
            .where(
              (r) =>
                  uCid == null ||
                  r['renterCompanyId'] == uCid ||
                  r['rentedCompanyId'] == uCid,
            )
            .toList();
        _trips = companyTrips;
        _managers = companyManagers;

        if (uCid != null) {
          final m = companies.where((c) => c['id'] == uCid);
          _company = m.isNotEmpty ? m.first : null;
        } else {
          _company = companies.isNotEmpty ? companies.first : null;
        }
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeTrips = _trips.where((t) => t['status'] != 'Completed').length;
    final completedTrips = _trips
        .where((t) => t['status'] == 'Completed')
        .length;
    final activeV = _vehicles.where((v) => v['isActive'] == true).length;
    final inactiveV = _vehicles.length - activeV;
    final activeRent = _rentals.where((r) => r['isCompleted'] == false).length;

    return RefreshIndicator(
      onRefresh: _load,
      color: kBlue,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Company header ──
            if (_company != null) ...[
              Text(
                _company!['companyName'] ?? _company!['name'] ?? '',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                [_company!['address'], _company!['phone']]
                    .where((v) => v != null && v.toString().isNotEmpty)
                    .join(' · '),
                style: const TextStyle(color: kMuted, fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
            ] else if (!_loading) ...[
              Text(
                'Hoş geldiniz, ${widget.user.name}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
            ],

            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
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
                    Icons.local_shipping_rounded,
                    'Şoförler',
                    _drivers.length,
                    sub:
                        '${_drivers.where((d) => d['driverTripStatus'] == 'on_trip').length} seferde',
                    color: kGreen,
                  ),
                  _stat(
                    Icons.directions_car_rounded,
                    'Araçlar',
                    _vehicles.length,
                    sub: '$activeV aktif · $inactiveV pasif',
                    color: kBlue,
                  ),
                  _stat(
                    Icons.map_rounded,
                    'Aktif Seferler',
                    activeTrips,
                    sub: '$completedTrips tamamlanan',
                    color: const Color(0xFF7C3AED),
                  ),
                  _stat(
                    Icons.swap_horiz_rounded,
                    'Kiralamalar',
                    activeRent,
                    sub: 'aktif kiralama',
                    color: const Color(0xFF0891B2),
                  ),
                  _stat(
                    Icons.manage_accounts_rounded,
                    'Yöneticiler',
                    _managers.length,
                    color: const Color(0xFFEA580C),
                  ),
                  _stat(
                    Icons.warning_amber_rounded,
                    'Devre Dışı Araçlar',
                    inactiveV,
                    color: const Color(0xFFD97706),
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

  /// Stat card — value is int count, OR label2 for currency strings
  Widget _stat(
    IconData icon,
    String label,
    int? value, {
    String? sub,
    String? label2,
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
                  label2 ?? '${value ?? 0}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
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
// Settings — matches web manager/tabs/SettingsTab.tsx
// ═══════════════════════════════════════════════════════════════════════════
class _CompanySettingsTab extends StatefulWidget {
  const _CompanySettingsTab();
  @override
  State<_CompanySettingsTab> createState() => _SettState();
}

class _SettState extends State<_CompanySettingsTab> {
  final _name = TextEditingController(text: 'Şirketim');
  final _email = TextEditingController(text: '');
  final _phone = TextEditingController(text: '');
  final _address = TextEditingController(text: '');
  bool _emailNotif = true, _smsNotif = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _address.dispose();
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
            'Ayarlar',
            style: TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          _card(Icons.business_rounded, 'Şirket Bilgileri', [
            kField('Şirket Adı', _name),
            kField('E-posta', _email, type: TextInputType.emailAddress),
            kField('Telefon', _phone, type: TextInputType.phone),
            kField('Adres', _address),
            _saveBtn(context, 'Şirket bilgileri güncellendi'),
          ]),
          const SizedBox(height: 14),
          _card(Icons.notifications_rounded, 'Bildirimler', [
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
            _saveBtn(context, 'Bildirim ayarları kaydedildi'),
          ]),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _card(IconData icon, String title, List<Widget> children) => Container(
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

  Widget _saveBtn(BuildContext ctx, String msg) => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: ElevatedButton.icon(
      style: ElevatedButton.styleFrom(backgroundColor: kBlue),
      onPressed: () => kSuccess(ctx, msg),
      icon: const Icon(Icons.save_rounded, size: 15, color: Colors.white),
      label: const Text('Kaydet', style: TextStyle(color: Colors.white)),
    ),
  );
}
