import 'package:flutter/material.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'shared_styles.dart';

// Tabs
import 'driver_profile_tab.dart';
import 'driver_company_tab.dart';
import 'driver_vehicle_tab.dart';
import 'driver_trips_tab.dart';
import 'driver_quick_actions_tab.dart';
import 'driver_accident_tab.dart';
import 'driver_settings_tab.dart';

// ─── Driver tabs matching web DriverPanel.tsx ─────────────────────────────
const _kTabDefs = [
  (id: 'profile', label: 'Profilim', icon: Icons.person_rounded),
  (id: 'company', label: 'Şirket', icon: Icons.business_rounded),
  (id: 'vehicle', label: 'Araç', icon: Icons.directions_car_rounded),
  (id: 'trips', label: 'Seferler', icon: Icons.map_rounded),
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
        return DriverProfileTab(user: widget.user);
      case 'company':
        return DriverCompanyTab(user: widget.user);
      case 'vehicle':
        return DriverVehicleTab(user: widget.user);
      case 'trips':
        return DriverTripsTab(user: widget.user);
      case 'quick':
        return const DriverQuickActionsTab();
      case 'accident':
        return DriverAccidentTab(user: widget.user);
      case 'settings':
        return DriverSettingsTab(onLogout: _logout);
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
