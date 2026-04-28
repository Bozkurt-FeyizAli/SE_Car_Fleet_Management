import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

const _emerald = Color(0xFF059669);

// ══════════════════════════════════════════════════════════════════════════════
// Vehicle Tab — matches web VehicleTab.tsx
// Fetches the driver's assigned vehicle via /api/Drivers (by userId)
// ══════════════════════════════════════════════════════════════════════════════
class DriverVehicleTab extends StatefulWidget {
  final UserModel user;
  const DriverVehicleTab({super.key, required this.user});
  @override
  State<DriverVehicleTab> createState() => _DriverVehicleTabState();
}

class _DriverVehicleTabState extends State<DriverVehicleTab> {
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
      final userId = int.tryParse(widget.user.id);
      if (userId != null) {
        // Find driver record by userId to get vehiclePlate
        final allDrivers = await _api.getDrivers();
        final driverRow = allDrivers
            .cast<Map<String, dynamic>>()
            .where((d) => d['userId'] == userId)
            .firstOrNull;

        final plate = driverRow?['vehiclePlate']?.toString();
        if (plate != null && plate.isNotEmpty) {
          final v = await _api.getVehicle(plate);
          if (mounted) setState(() => _vehicle = v as Map<String, dynamic>?);
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
                              _vehicle!['plate'] ??
                                  _vehicle!['plateNumber'] ??
                                  '—',
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
