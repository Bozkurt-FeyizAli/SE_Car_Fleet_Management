import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

const _emerald = Color(0xFF059669);

// ══════════════════════════════════════════════════════════════════════════════
// Profile Tab — matches web ProfileTab.tsx
// Fetches live user data from /api/User/{id}
// ══════════════════════════════════════════════════════════════════════════════
class DriverProfileTab extends StatefulWidget {
  final UserModel user;
  const DriverProfileTab({super.key, required this.user});
  @override
  State<DriverProfileTab> createState() => _DriverProfileTabState();
}

class _DriverProfileTabState extends State<DriverProfileTab> {
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
        final results = await Future.wait([
          _api.getUser(id),
          _api.getDrivers(),
          _api.getManagers(),
          _api.getUsers(),
        ]);

        final userData = results[0] as Map<String, dynamic>;
        final drivers = (results[1] as List).cast<Map<String, dynamic>>();
        final managers = (results[2] as List).cast<Map<String, dynamic>>();
        final users = (results[3] as List).cast<Map<String, dynamic>>();

        final driverData = drivers.firstWhere(
          (d) => d['userId'] == id,
          orElse: () => <String, dynamic>{},
        );

        // parentManagerId -> Manager.id -> Manager.userId -> User
        String? parentManagerName;
        final pmId = (userData['parentManagerId'] as num?)?.toInt();
        if (pmId != null) {
          final manager = managers.firstWhere(
            (m) => (m['id'] as num).toInt() == pmId,
            orElse: () => <String, dynamic>{},
          );
          if (manager.isNotEmpty) {
            final mUserId = manager['userId'];
            final mUser = users.firstWhere(
              (u) => u['id'] == mUserId,
              orElse: () => <String, dynamic>{},
            );
            if (mUser.isNotEmpty) {
              parentManagerName = '${mUser['firstName'] ?? ''} ${mUser['lastName'] ?? ''}'.trim();
            }
          }
        }

        if (!mounted) return;
        setState(() {
          _data = {
            ...userData,
            ...driverData,
            if (parentManagerName != null) 'parentManagerName': parentManagerName,
          };
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      return parts[0][0].toUpperCase();
    }
    return 'SF';
  }

  @override
  Widget build(BuildContext context) {
    final name = _data != null
        ? '${_data!['firstName'] ?? ''} ${_data!['lastName'] ?? ''}'.trim()
        : widget.user.name;
    final email = _data?['email'] ?? widget.user.email;
    final score = (_data?['points'] as num?)?.toInt() ?? 0;
    final status = _data?['status'] ?? 'Idle';
    final statusLabel = kStatusLabel(status);
    final statusColor = kStatusColor(status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile card
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
                    kBadge(statusLabel, statusColor),
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
                  _infoRow('E-posta', email, Icons.email_outlined),
                  _infoRow(
                    'Telefon',
                    (_data?['phoneNumber'] ?? '—').toString(),
                    Icons.phone_outlined,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // License & driver info
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
                    (_data?['licenseNumber'] ?? '—').toString(),
                    Icons.credit_card_rounded,
                  ),
                  _infoRow(
                    'Sürücü Puanı',
                    score.toString(),
                    Icons.star_rounded,
                  ),
                  _infoRow(
                    'Atanmış Araç',
                    (_data?['vehiclePlate'] ?? 'Araç atanmamış').toString(),
                    Icons.directions_car_rounded,
                  ),
                  _infoRow(
                    'Bağlı Yönetici',
                    (_data?['parentManagerName'] ?? 'Yönetici atanmamış'),
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
