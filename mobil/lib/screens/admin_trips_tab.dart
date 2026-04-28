import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminTripsTab extends StatefulWidget {
  final UserModel user;

  const AdminTripsTab({super.key, required this.user});

  @override
  State<AdminTripsTab> createState() => _AdminTripsTabState();
}

class _AdminTripsTabState extends State<AdminTripsTab> {
  final _api = ApiService();
  bool _loading = true;

  List<Map<String, dynamic>> _allTrips = [];
  List<Map<String, dynamic>> _locations = [];
  List<Map<String, dynamic>> _drivers = [];
  List<Map<String, dynamic>> _vehicles = [];

  String _filter = 'active'; // 'active' or 'completed'

  int get _companyId => widget.user.companyId ?? 1;

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    try {
      // Fetch reference data to resolve names
      final locs = await _api.getLocationsByCompany(_companyId);
      final users = await _api.getUsers();
      final rawDrivers = await _api.getDrivers();
      final vehs = await _api.getVehicles();

      // Filter company users and link them with Driver table records
      final companyUsers = users.where((u) => u['companyId'] == _companyId).toList();
      final userIds = companyUsers.map((u) => u['id']).toSet();
      
      _drivers = rawDrivers.where((d) => userIds.contains(d['userId'])).map((d) {
        final user = companyUsers.firstWhere((u) => u['id'] == d['userId']);
        return <String, dynamic>{
          ...user,
          ...d,
          'driverTableId': d['id'],
          'driverName': d['driverName'] ?? '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
        };
      }).toList();
      _locations = List<Map<String, dynamic>>.from(locs);
      final companyVehicles = vehs.where((v) => v['companyId'] == _companyId).toList();
      _vehicles = List<Map<String, dynamic>>.from(companyVehicles);

      await _loadTrips();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Veriler yüklenemedi: $e');
    }
  }

  Future<void> _loadTrips() async {
    setState(() => _loading = true);
    try {
      List<dynamic> list;
      if (_filter == 'active') {
        list = await _api.getActiveTripsByCompany(_companyId);
      } else {
        // Fetch all, then filter completed
        final all = await _api.getAllTrips();
        // Since getAllTrips might return trips for all companies if admin, filter by company
        list = all.where((t) => t['companyId'] == _companyId && t['status'] == 'Completed').toList();
      }

      if (!mounted) return;
      setState(() {
        _allTrips = List<Map<String, dynamic>>.from(list);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Seferler yüklenemedi: $e');
    }
  }

  String _getLocationName(int? locId) {
    if (locId == null) return 'Bilinmiyor';
    final loc = _locations.where((l) => l['id'] == locId).firstOrNull;
    return loc?['locationName'] ?? 'Depo $locId';
  }

  String _getDriverName(int? driverId) {
    if (driverId == null) return 'Bilinmiyor';
    final d = _drivers.where((d) => d['driverTableId'] == driverId).firstOrNull;
    if (d != null) {
      return d['driverName'] ?? 'İsimsiz Şoför';
    }
    return 'Şoför $driverId';
  }

  Future<void> _openStartTripDialog() async {
    int? selectedDriverId;
    String? selectedVehiclePlate;
    int? selectedStartLocId;
    int? selectedEndLocId;

    // Get currently active trips to exclude busy drivers and vehicles locally
    final activeTrips = _filter == 'active' 
        ? _allTrips 
        : await _api.getActiveTripsByCompany(_companyId).catchError((_) => []);
    
    final busyDriverIds = activeTrips.map((t) => t['driverId']).toSet();
    final busyVehiclePlates = activeTrips.map((t) => t['vehiclePlate']).toSet();

    // Filter available entities and deduplicate to prevent Dropdown assertion errors
    // Backend enum: 'Idle' = available, 'InTrip' = busy
    final uniqueDriversMap = <int, Map<String, dynamic>>{};
    for (var d in _drivers) {
      final isIdle = d['status'] == 'Idle';
      if (d['driverTableId'] != null && isIdle) {
        uniqueDriversMap[d['driverTableId']] = d;
      }
    }
    final availableDrivers = uniqueDriversMap.values.toList();

    final uniqueVehiclesMap = <String, Map<String, dynamic>>{};
    for (var v in _vehicles) {
      final plate = v['plate'] ?? v['plateNumber'];
      if (plate != null && 
          v['isActive'] == true && 
          !busyVehiclePlates.contains(plate)) {
        uniqueVehiclesMap[plate] = v;
      }
    }
    final availableVehicles = uniqueVehiclesMap.values.toList();

    final uniqueLocationsMap = <int, Map<String, dynamic>>{};
    for (var l in _locations) {
      if (l['id'] != null) {
        uniqueLocationsMap[l['id']] = l;
      }
    }
    final uniqueLocations = uniqueLocationsMap.values.toList();

    if (availableDrivers.isEmpty) {
      kError(context, 'Uygun şoför bulunamadı.');
      return;
    }
    if (availableVehicles.isEmpty) {
      kError(context, 'Uygun araç bulunamadı.');
      return;
    }
    if (uniqueLocations.length < 2) {
      kError(context, 'Sefer oluşturmak için en az 2 depo olmalıdır.');
      return;
    }

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: kCard,
            title: const Text('Yeni Sefer Başlat', style: TextStyle(color: Colors.white, fontSize: 16)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    dropdownColor: kCard,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Şoför Seç',
                      labelStyle: const TextStyle(color: kMuted),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBorder), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBlue), borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    value: selectedDriverId,
                    items: availableDrivers.map((d) {
                      final assignedVehicle = d['vehiclePlate'] != null ? ' (Araç: ${d['vehiclePlate']})' : '';
                      return DropdownMenuItem<int>(
                        value: d['driverTableId'],
                        child: Text('${d['driverName'] ?? 'İsimsiz Şoför'}$assignedVehicle'),
                      );
                    }).toList(),
                    onChanged: (v) {
                      setDialogState(() {
                        selectedDriverId = v;
                        // Auto-select assigned vehicle if possible
                        final driver = availableDrivers.firstWhere((d) => d['driverTableId'] == v);
                        if (driver['vehiclePlate'] != null) {
                          final plate = driver['vehiclePlate'].toString();
                          if (availableVehicles.any((veh) {
                            final vp = veh['plate'] ?? veh['plateNumber'];
                            return vp == plate;
                          })) {
                            selectedVehiclePlate = plate;
                          }
                        }
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    dropdownColor: kCard,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Araç Seç',
                      labelStyle: const TextStyle(color: kMuted),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBorder), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBlue), borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    value: selectedVehiclePlate,
                    items: availableVehicles.map((v) {
                      final plate = v['plate'] ?? v['plateNumber'];
                      return DropdownMenuItem<String>(
                        value: plate,
                        child: Text('$plate - ${v['brandModel'] ?? ''}'),
                      );
                    }).toList(),
                    onChanged: (v) => setDialogState(() => selectedVehiclePlate = v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    dropdownColor: kCard,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Çıkış Deposu',
                      labelStyle: const TextStyle(color: kMuted),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBorder), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBlue), borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    value: selectedStartLocId,
                    items: uniqueLocations.map((l) {
                      return DropdownMenuItem<int>(
                        value: l['id'],
                        child: Text(l['locationName'] ?? 'Depo ${l['id']}'),
                      );
                    }).toList(),
                    onChanged: (v) {
                      setDialogState(() {
                        selectedStartLocId = v;
                        if (selectedEndLocId == v) selectedEndLocId = null;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    dropdownColor: kCard,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Varış Deposu',
                      labelStyle: const TextStyle(color: kMuted),
                      enabledBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBorder), borderRadius: BorderRadius.circular(8)),
                      focusedBorder: OutlineInputBorder(borderSide: const BorderSide(color: kBlue), borderRadius: BorderRadius.circular(8)),
                    ),
                    style: const TextStyle(color: Colors.white),
                    value: selectedEndLocId,
                    items: uniqueLocations.where((l) => l['id'] != selectedStartLocId).map((l) {
                      return DropdownMenuItem<int>(
                        value: l['id'],
                        child: Text(l['locationName'] ?? 'Depo ${l['id']}'),
                      );
                    }).toList(),
                    onChanged: (v) => setDialogState(() => selectedEndLocId = v),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('İptal', style: TextStyle(color: kMuted)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: kGreen),
                onPressed: () {
                  if (selectedDriverId == null || selectedVehiclePlate == null || selectedStartLocId == null || selectedEndLocId == null) {
                    kError(context, 'Lütfen tüm alanları doldurun.');
                    return;
                  }
                  Navigator.pop(ctx, true);
                },
                child: const Text('Başlat', style: TextStyle(color: Colors.white)),
              ),
            ],
          );
        });
      },
    );
    if (ok != true || !mounted) return;

    setState(() => _loading = true);
    try {
      final payload = {
        'driverId': selectedDriverId,
        'vehiclePlate': selectedVehiclePlate,
        'startLocationId': selectedStartLocId,
        'endLocationId': selectedEndLocId,
      };
      debugPrint('=== startTrip PAYLOAD: $payload');
      await _api.startTrip(payload);

      if (mounted) kSuccess(context, 'Sefer başarıyla başlatıldı!');
      await _loadTrips();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      debugPrint('=== startTrip ERROR: $e');
      kError(context, 'Sefer başlatılamadı: $e');
    }
  }

  Future<void> _openCompleteTripDialog(Map<String, dynamic> trip) async {
    final kmC = TextEditingController();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Seferi Bitir', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Araç seferi tamamladı. Lütfen aracın güncel kilometre bilgisini girin.', style: TextStyle(color: kMuted, fontSize: 13)),
            const SizedBox(height: 16),
            kField('Bitiş KM', kmC, type: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('İptal', style: TextStyle(color: kMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Bitir', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;

    final kmText = kmC.text.trim().replaceAll(',', '.');
    final endKm = double.tryParse(kmText);

    if (endKm == null || endKm < 0) {
      kError(context, 'Geçerli bir kilometre değeri girin.');
      return;
    }

    setState(() => _loading = true);
    try {
      await _api.completeTrip(trip['id'], endKm);
      if (mounted) kSuccess(context, 'Sefer tamamlandı!');
      await _loadTrips();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Sefer bitirilemedi: $e');
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
              // Filter Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: kCard,
                child: Row(
                  children: [
                    Expanded(
                      child: SegmentedButton<String>(
                        style: SegmentedButton.styleFrom(
                          backgroundColor: kBg,
                          selectedForegroundColor: Colors.white,
                          selectedBackgroundColor: kBlue,
                          side: const BorderSide(color: kBorder),
                        ),
                        segments: const [
                          ButtonSegment(value: 'active', label: Text('Aktif Seferler')),
                          ButtonSegment(value: 'completed', label: Text('Tamamlananlar')),
                        ],
                        selected: {_filter},
                        onSelectionChanged: (val) {
                          setState(() {
                            _filter = val.first;
                          });
                          _loadTrips();
                        },
                      ),
                    ),
                  ],
                ),
              ),

              // Trip List
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator(color: kBlue))
                    : _allTrips.isEmpty
                        ? const Center(
                            child: Text(
                              'Sefer bulunamadı.',
                              style: TextStyle(color: kMuted),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16).copyWith(bottom: 80),
                            itemCount: _allTrips.length,
                            itemBuilder: (context, index) {
                              final t = _allTrips[index];
                              final startLoc = _getLocationName(t['startLocationId']);
                              final endLoc = _getLocationName(t['endLocationId']);
                              final driver = _getDriverName(t['driverId']);
                              final vehicle = t['vehiclePlate'] ?? 'Bilinmiyor';
                              final status = t['status'] ?? 'Active';

                              return Container(
                                margin: const EdgeInsets.only(bottom: 12),
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
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.directions_car_rounded, color: kBlue, size: 20),
                                            const SizedBox(width: 8),
                                            Text(
                                              vehicle,
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                            ),
                                          ],
                                        ),
                                        kBadge(
                                          status == 'Completed' ? 'Tamamlandı' : 'Aktif',
                                          status == 'Completed' ? kGreen : Colors.orange,
                                        ),
                                      ],
                                    ),
                                    const Divider(color: kBorder, height: 24),
                                    Row(
                                      children: [
                                        const Icon(Icons.person_rounded, color: kMuted, size: 16),
                                        const SizedBox(width: 8),
                                        Text('Şoför: $driver', style: const TextStyle(color: kMuted, fontSize: 13)),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        const Icon(Icons.my_location_rounded, color: Colors.orange, size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(startLoc, style: const TextStyle(color: Colors.white, fontSize: 14))),
                                      ],
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.only(left: 7, top: 4, bottom: 4),
                                      child: Container(width: 2, height: 16, color: kBorder),
                                    ),
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_rounded, color: kRed, size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(endLoc, style: const TextStyle(color: Colors.white, fontSize: 14))),
                                      ],
                                    ),
                                    if (status != 'Completed') ...[
                                      const SizedBox(height: 16),
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: kBlue.withOpacity(0.1),
                                            foregroundColor: kBlue,
                                            side: const BorderSide(color: kBlue),
                                          ),
                                          onPressed: () => _openCompleteTripDialog(t),
                                          icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                                          label: const Text('Seferi Bitir'),
                                        ),
                                      ),
                                    ] else if (t['endKm'] != null) ...[
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          const Icon(Icons.speed_rounded, color: kMuted, size: 16),
                                          const SizedBox(width: 8),
                                          Text('Bitiş KM: ${t['endKm']}', style: const TextStyle(color: kMuted, fontSize: 13)),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
        Positioned(
          bottom: 24,
          right: 24,
          child: FloatingActionButton.extended(
            onPressed: _openStartTripDialog,
            backgroundColor: kGreen,
            icon: const Icon(Icons.add_road_rounded, color: Colors.white),
            label: const Text('Sefer Başlat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }
}
