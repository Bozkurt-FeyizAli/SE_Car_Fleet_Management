import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';
import 'vehicle_detail_screen.dart';

class AdminVehiclesTab extends StatefulWidget {
  final UserModel user;
  const AdminVehiclesTab({super.key, required this.user});
  @override
  State<AdminVehiclesTab> createState() => _State();
}

class _State extends State<AdminVehiclesTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  bool _loading = true;
  final _search = TextEditingController();
  String _statusFilter = 'Tümü';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getVehicles().catchError((_) => <dynamic>[]),
        _api.getVehicleRegistrations().catchError((_) => <dynamic>[]),
        _api.getDrivers().catchError((_) => <dynamic>[]),
        _api.getRentals().catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;

      final vList = (results[0] as List).cast<Map<String, dynamic>>();
      final rList = (results[1] as List).cast<Map<String, dynamic>>();
      final dList = (results[2] as List).cast<Map<String, dynamic>>();
      final renList = (results[3] as List).cast<Map<String, dynamic>>();

      final rMap = {for (var r in rList) r['registrationNumber']: r};
      final myCompanyId = widget.user.companyId ?? 1;

      final processedList = <Map<String, dynamic>>[];

      for (var v in vList) {
        final plate = v['plate'] ?? v['plateNumber'];
        final reg = rMap[v['registrationNumber']];
        if (reg != null) {
          v['brandModel'] = reg['brandModel'];
          v['year'] = reg['year'];
          v['vehicleType'] = reg['type'];
          v['capacityKg'] = reg['capacity'];
        }

        // Check driver
        final matchingDrivers = dList.where((d) => d['vehiclePlate'] == plate);
        final driver = matchingDrivers.isNotEmpty ? matchingDrivers.first : null;
        if (driver != null) {
          v['driverName'] = driver['driverName'];
          v['driverStatus'] = driver['status'];
        }

        // Check rentals
        final activeRentals = renList.where((r) => r['vehiclePlate'] == plate && r['isCompleted'] == false).toList();
        
        bool isRentedOut = false;
        bool isRentedIn = false;

        if (activeRentals.isNotEmpty) {
          final rental = activeRentals.first;
          if (rental['ownerCompanyId'] == myCompanyId && rental['renterCompanyId'] != myCompanyId) {
            isRentedOut = true;
          } else if (rental['renterCompanyId'] == myCompanyId && rental['ownerCompanyId'] != myCompanyId) {
            isRentedIn = true;
          }
        }

        v['isRentedOut'] = isRentedOut;
        v['isRentedIn'] = isRentedIn;
        v['isOnTrip'] = driver != null && driver['status'] == 'InTrip';
        
        bool isMaintenance = v['isActive'] == false || ((v['currentKm'] as num?) ?? 0) >= ((v['nextMaintenanceKm'] as num?) ?? 999999);
        v['isMaintenance'] = isMaintenance;
        
        v['isAvailable'] = !isRentedOut && !v['isOnTrip'] && !isMaintenance;

        // Filtering logic: include if we own it, or if we rented it in
        if (widget.user.role == UserRole.superAdmin || 
            (myCompanyId != null && v['companyId'] == myCompanyId) || 
            isRentedIn) {
          processedList.add(v);
        }
      }

      setState(() {
        _all = processedList;
        _filter();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Yüklenemedi: $e');
    }
  }

  void _filter() {
    final q = _search.text.toLowerCase();
    _shown = _all.where((v) {
      if (q.isNotEmpty &&
          !('${v['plate'] ?? v['plateNumber']} ${v['brandModel']}'
              .toLowerCase()
              .contains(q))) {
        return false;
      }
      
      switch (_statusFilter) {
        case 'Müsait':
          return v['isAvailable'] == true;
        case 'Seferde':
          return v['isOnTrip'] == true;
        case 'Kiralandı':
          return v['isRentedOut'] == true;
        case 'Kiralık Geldi':
          return v['isRentedIn'] == true;
        case 'Bakımda':
          return v['isMaintenance'] == true;
        default:
          return true; // Tümü
      }
    }).toList();
  }

  String? _dateOf(dynamic val) => val?.toString().split('T').first;

  Future<void> _openDetail({Map<String, dynamic>? item}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VehicleDetailScreen(
          user: widget.user,
          item: item,
        ),
      ),
    );
    if (result == true) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          color: kBg,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: TextField(
                        controller: _search,
                        style: const TextStyle(color: Colors.white),
                        decoration: fieldDecor('Araç ara...').copyWith(
                          prefixIcon: const Icon(
                            Icons.search,
                            color: kMuted,
                            size: 20,
                          ),
                        ),
                        onChanged: (_) => setState(_filter),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: DropdownButtonFormField<String>(
                        value: _statusFilter,
                        isExpanded: true,
                        dropdownColor: kCard,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: fieldDecor('Durum'),
                        items: const [
                          DropdownMenuItem(value: 'Tümü', child: Text('Tümü')),
                          DropdownMenuItem(value: 'Müsait', child: Text('Müsait')),
                          DropdownMenuItem(value: 'Seferde', child: Text('Seferde')),
                          DropdownMenuItem(value: 'Kiralandı', child: Text('Kiralandı')),
                          DropdownMenuItem(value: 'Kiralık Geldi', child: Text('Kiralık Geldi')),
                          DropdownMenuItem(value: 'Bakımda', child: Text('Bakımda')),
                        ],
                        onChanged: (v) {
                          setState(() {
                            _statusFilter = v ?? 'Tümü';
                            _filter();
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              if (_loading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator(color: kBlue)),
                )
              else
                Expanded(
                  child: _shown.isEmpty
                      ? const Center(
                          child: Text(
                            'Kayıtlı araç yok.',
                            style: TextStyle(color: kMuted),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) {
                            final v = _shown[i];
                            final active = v['isActive'] == true;
                            return InkWell(
                              onTap: () => _openDetail(item: v),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
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
                                            (v['plate'] ??
                                                    v['plateNumber'] ??
                                                    '—')
                                                .toString(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 15,
                                            ),
                                          ),
                                        ),
                                        if (v['isRentedIn'] == true) ...[
                                          kBadge('Kiralık Geldi', Colors.purple),
                                          const SizedBox(width: 4),
                                        ],
                                        if (v['isRentedOut'] == true) ...[
                                          kBadge('Kiralandı', Colors.orange),
                                          const SizedBox(width: 4),
                                        ],
                                        if (v['isOnTrip'] == true) ...[
                                          kBadge('Seferde', Colors.blue),
                                          const SizedBox(width: 4),
                                        ],
                                        kBadge(
                                          active ? 'Aktif' : 'Pasif',
                                          active ? Colors.green : Colors.grey,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${v['brandModel'] ?? '—'}  ·  ${v['year'] ?? '—'}  ·  ${v['vehicleType'] ?? '—'}',
                                      style: const TextStyle(
                                        color: kMuted,
                                        fontSize: 12,
                                      ),
                                    ),
                                    if (v['driverName'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          'Şoför: ${v['driverName']}',
                                          style: const TextStyle(color: Colors.lightBlueAccent, fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    Text(
                                      'Kasko: ${_dateOf(v['cascoEndDate']) ?? '—'}  ·  Sigorta: ${_dateOf(v['insuranceEndDate']) ?? '—'}',
                                      style: const TextStyle(
                                        color: kMuted,
                                        fontSize: 11,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    const Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        Text('Detayları Gör', style: TextStyle(color: kBlue, fontSize: 12, fontWeight: FontWeight.bold)),
                                        Icon(Icons.chevron_right, color: kBlue, size: 16),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
            ],
          ),
        ),
        Positioned(
          right: 16,
          bottom: 24,
          child: FloatingActionButton.extended(
            backgroundColor: kBlue,
            onPressed: () => _openDetail(),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Araç Ekle',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
