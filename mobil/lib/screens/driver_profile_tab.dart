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
    if (parts.isNotEmpty && parts[0].isNotEmpty) {
      return parts[0][0].toUpperCase();
    }
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
