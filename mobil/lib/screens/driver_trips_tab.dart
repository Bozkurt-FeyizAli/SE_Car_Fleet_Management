import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';
import 'driver_map_screen.dart';

const _emerald = Color(0xFF059669);

// ══════════════════════════════════════════════════════════════════════════════
// Trips Tab — Shows ONLY the active trip assigned by the company manager
// ══════════════════════════════════════════════════════════════════════════════
class DriverTripsTab extends StatefulWidget {
  final UserModel user;
  const DriverTripsTab({super.key, required this.user});

  @override
  State<DriverTripsTab> createState() => _DriverTripsTabState();
}

class _DriverTripsTabState extends State<DriverTripsTab> {
  final _api = ApiService();
  bool _loading = true;

  Map<String, dynamic>? _driverRecord; // row from /api/Drivers
  String? _vehiclePlate;
  int? _driverTableId;

  Map<String, dynamic>? _activeTrip;
  List<Map<String, dynamic>> _locations = [];

  int get _companyId => widget.user.companyId ?? 1;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  // ── data loading ──────────────────────────────────────────────────────────
  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final userId = int.tryParse(widget.user.id);
      if (userId == null) throw Exception('Geçersiz kullanıcı ID');

      // 1) Find this user's Driver record
      final allDrivers = await _api.getDrivers();
      _driverRecord = allDrivers
          .cast<Map<String, dynamic>>()
          .where((d) => d['userId'] == userId)
          .firstOrNull;

      if (_driverRecord != null) {
        _driverTableId = _driverRecord!['id'];
        _vehiclePlate = _driverRecord!['vehiclePlate']?.toString();
      }

      // 2) Company locations (for resolving names and coords)
      _locations = List<Map<String, dynamic>>.from(
        await _api.getLocationsByCompany(_companyId),
      );

      // 3) Load trips and find the single active trip
      await _loadActiveTrip();
    } catch (e) {
      debugPrint('_TripsTab _loadAll error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadActiveTrip() async {
    setState(() => _loading = true);
    try {
      final raw = await _api.getActiveTripsByCompany(_companyId);
      
      // Find the first active trip assigned to this driver
      if (_driverTableId != null) {
        _activeTrip = raw
            .cast<Map<String, dynamic>>()
            .where((t) => t['driverId'] == _driverTableId && t['status'] != 'Completed')
            .firstOrNull;
      }
      
      if (mounted) {
        setState(() => _loading = false);
      }
    } catch (e) {
      debugPrint('_loadActiveTrip error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _locName(int? id) {
    if (id == null) return 'Bilinmiyor';
    return _locations
            .where((l) => l['id'] == id)
            .firstOrNull?['locationName'] ??
        'Depo $id';
  }

  // ── navigate to map ───────────────────────────────────────────────────────
  void _openMap() async {
    debugPrint('DriverTripsTab: _openMap called');
    if (_activeTrip == null) {
      debugPrint('DriverTripsTab: _activeTrip is null');
      return;
    }
    
    debugPrint('DriverTripsTab: pushing DriverMapScreen');
    // Pass the locations list to the map screen so it can look up coords
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DriverMapScreen(
          trip: _activeTrip!,
          locations: _locations,
          apiService: _api,
        ),
      ),
    );
    debugPrint('DriverTripsTab: returned from DriverMapScreen');
    
    // When returning from map, reload to check if trip was completed
    _loadAll();
  }

  // ── build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final hasVehicle = _vehiclePlate != null;

    return Container(
      color: kBg,
      child: Column(
        children: [
          // ── driver / vehicle info bar ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: kCard,
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: _emerald.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.directions_car_rounded,
                      color: _emerald, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hasVehicle
                            ? 'Araç: $_vehiclePlate'
                            : 'Araç ataması yok',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14),
                      ),
                      if (_driverRecord != null)
                        Text(
                          'Durum: ${kStatusLabel(_driverRecord!['status'])}',
                          style: const TextStyle(color: kMuted, fontSize: 12),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── active trip view ──
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: _emerald))
                : _driverRecord == null
                    ? const Center(
                        child: Text('Şoför kaydı bulunamadı.',
                            style: TextStyle(color: kMuted)))
                    : _activeTrip == null
                        ? _buildEmptyState()
                        : _buildActiveTripCard(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(40),
            ),
            child: const Icon(Icons.check_circle_outline_rounded, size: 40, color: kMuted),
          ),
          const SizedBox(height: 16),
          const Text(
            'Atanmış Sefer Yok',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Şu anda size atanmış aktif bir sefer bulunmuyor.\nYeni görevler yöneticiniz tarafından atanacaktır.',
            textAlign: TextAlign.center,
            style: TextStyle(color: kMuted, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveTripCard() {
    final t = _activeTrip!;
    final startLoc = _locName(t['startLocationId']);
    final endLoc = _locName(t['endLocationId']);
    final status = t['status'] ?? 'Active';
    final vehicle = t['vehiclePlate'] ?? '—';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16).copyWith(bottom: 80),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Güncel Sefer',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _emerald.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: _emerald.withValues(alpha: 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(children: [
                      const Icon(Icons.directions_car_rounded,
                          color: _emerald, size: 24),
                      const SizedBox(width: 8),
                      Text(vehicle,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18)),
                    ]),
                    kBadge(
                      kStatusLabel(status),
                      kStatusColor(status),
                    ),
                  ],
                ),
                const Divider(color: kBorder, height: 32),
                
                // Route timeline
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.my_location_rounded, color: Colors.orange, size: 20),
                        Container(width: 2, height: 40, color: kBorder, margin: const EdgeInsets.symmetric(vertical: 4)),
                        const Icon(Icons.location_on_rounded, color: kRed, size: 20),
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Çıkış Noktası', style: TextStyle(color: kMuted, fontSize: 12)),
                              const SizedBox(height: 2),
                              Text(startLoc, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Varış Noktası', style: TextStyle(color: kMuted, fontSize: 12)),
                              const SizedBox(height: 2),
                              Text(endLoc, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _emerald,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: _openMap,
                    icon: const Icon(Icons.map_rounded, size: 22),
                    label: const Text(
                      'Haritada Görüntüle',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
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
