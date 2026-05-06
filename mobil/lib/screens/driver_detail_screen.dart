import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class DriverDetailScreen extends StatefulWidget {
  final Map<String, dynamic>? item;
  final int defaultCompanyId;

  const DriverDetailScreen({
    super.key,
    this.item,
    required this.defaultCompanyId,
  });

  @override
  State<DriverDetailScreen> createState() => _DriverDetailScreenState();
}

class _DriverDetailScreenState extends State<DriverDetailScreen> {
  final _api = ApiService();
  bool _loading = false;

  late TextEditingController firstC;
  late TextEditingController lastC;
  late TextEditingController emailC;
  late TextEditingController passC;
  late TextEditingController phoneC;
  late TextEditingController tcC;
  late TextEditingController licC;
  late TextEditingController scoreC;

  String licType = 'B';
  String status = 'Idle'; // Backend enum: 'Idle' | 'InTrip'

  List<Map<String, dynamic>> _vehicles = [];
  Map<String, dynamic>? _selectedVehicleToAssign;
  String? _currentlyAssignedPlate;

  Map<String, String> _plateToDriver = {};
  List<Map<String, dynamic>> _allDrivers = [];

  // Manager assignment
  List<Map<String, dynamic>> _managers = [];
  List<Map<String, dynamic>> _users = [];
  int? _currentManagerId;
  Map<String, dynamic>? _selectedManagerToAssign;
  bool _managerChanged = false;

  @override
  void initState() {
    super.initState();
    final item = widget.item;

    firstC = TextEditingController(text: item?['firstName'] ?? '');
    lastC = TextEditingController(text: item?['lastName'] ?? '');
    emailC = TextEditingController(text: item?['email'] ?? '');
    passC = TextEditingController();
    phoneC = TextEditingController(
      text: item?['phoneNumber'] ?? item?['phone'] ?? '',
    );
    tcC = TextEditingController(text: item?['tcIdentityNumber'] ?? '');
    licC = TextEditingController(
      text: item?['licenseNumber'] ?? item?['driverLicenseId'] ?? '',
    );
    scoreC = TextEditingController(
      text: (item?['points'] ?? item?['driverScore'] ?? 100).toString(),
    );

    licType = item?['licenseType'] ?? 'B';
    // Backend status enum: 'Idle' = available, 'InTrip' = busy
    status = item?['status'] ?? 'Idle';

    _currentlyAssignedPlate = item?['vehiclePlate'];
    _currentManagerId = (item?['parentManagerId'] as num?)?.toInt();

    _loadVehicles();
  }

  Future<void> _loadVehicles() async {
    try {
      final results = await Future.wait([
        _api.getVehicles(),
        _api.getUsers(),
        _api.getDrivers(),
        _api.getAllRentals(),
        _api.getManagers(),
      ]);
      final list = results[0].cast<Map<String, dynamic>>();
      final users = results[1].cast<Map<String, dynamic>>();
      final drivers = results[2].cast<Map<String, dynamic>>();
      final rentals = results[3].cast<Map<String, dynamic>>();
      final managers = results[4].cast<Map<String, dynamic>>();

      if (!mounted) return;

      final p2d = <String, String>{};
      for (final dr in drivers) {
        final plate = dr['vehiclePlate'];
        if (plate != null) {
          final uid = dr['userId'];
          final u = users.firstWhere(
            (u) => u['id'] == uid,
            orElse: () => <String, dynamic>{},
          );
          if (u.isNotEmpty) {
            p2d[plate.toString()] = '${u['firstName']} ${u['lastName']}';
          }
        }
      }

      final availableList = <Map<String, dynamic>>[];
      for (final v in list) {
        final plate = v['plate'] ?? v['plateNumber'];
        final activeRentals = rentals.where((r) => r['vehiclePlate'] == plate && r['isCompleted'] == false).toList();
        
        bool isRentedOut = false;
        bool isRentedIn = false;
        if (activeRentals.isNotEmpty) {
          final rental = activeRentals.first;
          if (rental['ownerCompanyId'] == widget.defaultCompanyId && rental['renterCompanyId'] != widget.defaultCompanyId) {
            isRentedOut = true;
          } else if (rental['renterCompanyId'] == widget.defaultCompanyId && rental['ownerCompanyId'] != widget.defaultCompanyId) {
            isRentedIn = true;
          }
        }
        
        bool isMaintenance = ((v['currentKm'] as num?) ?? 0) >= ((v['nextMaintenanceKm'] as num?) ?? 999999);
        final isOwned = v['companyId'] == widget.defaultCompanyId;
        
        // Müsait: Includes Owned or RentedIn, excludes RentedOut, excludes Maintenance.
        if ((isOwned || isRentedIn) && !isRentedOut && !isMaintenance) {
          availableList.add(v);
        } else if (plate == _currentlyAssignedPlate) {
          // Always include the currently assigned vehicle so it doesn't disappear from dropdown
          availableList.add(v);
        }
      }

      // Filter managers by same company
      final companyManagers = managers.where((m) {
        final mUser = users.firstWhere((u) => u['id'] == m['userId'], orElse: () => <String, dynamic>{});
        return mUser.isNotEmpty && (mUser['companyId'] == widget.defaultCompanyId);
      }).toList();

      setState(() {
        _allDrivers = drivers;
        _plateToDriver = p2d;
        _vehicles = availableList;
        _managers = companyManagers;
        _users = users;
      });
    } catch (e) {
      // Ignore gracefully
    }
  }

  @override
  void dispose() {
    firstC.dispose();
    lastC.dispose();
    emailC.dispose();
    passC.dispose();
    phoneC.dispose();
    tcC.dispose();
    licC.dispose();
    scoreC.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (firstC.text.isEmpty || lastC.text.isEmpty) {
      kError(context, 'Ad ve Soyad zorunludur');
      return;
    }
    if (licC.text.isEmpty) {
      kError(context, 'Ehliyet No zorunludur');
      return;
    }

    setState(() => _loading = true);

    try {
      String? plateToAssign;
      if (_selectedVehicleToAssign != null) {
        if (_selectedVehicleToAssign!['plate'] == '-1') {
          plateToAssign = null; // Unassign marker
        } else {
          plateToAssign =
              _selectedVehicleToAssign!['plate'] ??
              _selectedVehicleToAssign!['plateNumber'];
        }
      } else {
        plateToAssign = _currentlyAssignedPlate;
      }

      final item = widget.item;

      if (item != null && item['driverId'] != null) {
        // Güncelle
        final userBody = <String, dynamic>{
          'firstName': firstC.text,
          'lastName': lastC.text,
          'email': emailC.text,
          'role': 2,
          'phoneNumber': phoneC.text,
          'tcIdentityNumber': tcC.text,
          'parentManagerId': _managerChanged
              ? (_selectedManagerToAssign != null && _selectedManagerToAssign!['id'] != -1
                  ? _selectedManagerToAssign!['id']
                  : null)
              : _currentManagerId,
          'criminalRecord': null,
          'companyId': item['companyId'] ?? widget.defaultCompanyId,
          if (passC.text.isNotEmpty) 'passwordHash': passC.text,
        };
        if (item['userId'] != null) {
          await _api.updateUser(item['userId'], userBody);
        }

        final licenseBody = {
          'licenseNumber': licC.text,
          'licenseType': licType,
        };
        try {
          await _api.updateLicense(licC.text, licenseBody);
        } catch (_) {
          try {
            await _api.createLicense(licenseBody);
          } catch (_) {}
        }

        final driverBody = <String, dynamic>{
          'userId': item['userId'],
          'vehiclePlate': plateToAssign,
          'licenseNumber': licC.text,
          'points': int.tryParse(scoreC.text) ?? 100,
          'status': status,
        };
        await _api.updateDriver(item['driverId'], driverBody);

        if (plateToAssign != null && plateToAssign != _currentlyAssignedPlate) {
          final otherDrivers = _allDrivers
              .where(
                (d) =>
                    d['vehiclePlate'] == plateToAssign &&
                    d['id'] != item['driverId'],
              )
              .toList();
          for (final od in otherDrivers) {
            final odBody = Map<String, dynamic>.from(od);
            odBody['vehiclePlate'] = null;
            await _api.updateDriver(od['id'], odBody);
          }
        }

        if (mounted) kSuccess(context, 'Şoför güncellendi');
      } else {
        // Yeni Oluştur
        final userBody = <String, dynamic>{
          'firstName': firstC.text,
          'lastName': lastC.text,
          'email': emailC.text,
          'role': 2,
          'phoneNumber': phoneC.text,
          'tcIdentityNumber': tcC.text,
          'parentManagerId': _managerChanged
              ? (_selectedManagerToAssign != null && _selectedManagerToAssign!['id'] != -1
                  ? _selectedManagerToAssign!['id']
                  : null)
              : null,
          'criminalRecord': null,
          'companyId': widget.defaultCompanyId,
          if (passC.text.isNotEmpty) 'passwordHash': passC.text,
        };
        final userRes = await _api.createUser(userBody);
        final newUserId = userRes?['id'] ?? userRes?['userId'];

        if (newUserId != null) {
          final licenseBody = {
            'licenseNumber': licC.text,
            'licenseType': licType,
          };
          try {
            await _api.createLicense(licenseBody);
          } catch (_) {
            try {
              await _api.updateLicense(licC.text, licenseBody);
            } catch (_) {}
          }

          final driverBody = <String, dynamic>{
            'userId': newUserId,
            'vehiclePlate': plateToAssign,
            'licenseNumber': licC.text,
            'points': int.tryParse(scoreC.text) ?? 100,
            'status': status,
          };
          await _api.createDriver(driverBody);

          if (plateToAssign != null) {
            final otherDrivers = _allDrivers
                .where((d) => d['vehiclePlate'] == plateToAssign)
                .toList();
            for (final od in otherDrivers) {
              final odBody = Map<String, dynamic>.from(od);
              odBody['vehiclePlate'] = null;
              await _api.updateDriver(od['id'], odBody);
            }
          }
        }
        if (mounted) kSuccess(context, 'Şoför eklendi');
      }

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        kError(context, 'İşlem başarısız: $e');
      }
    }
  }

  Future<void> _delete() async {
    if (widget.item == null) return;

    final name = '${widget.item!['firstName']} ${widget.item!['lastName']}';
    final driverId = widget.item!['driverId'];
    final userId = widget.item!['userId'];
    final lic =
        widget.item!['licenseNumber'] ?? widget.item!['driverLicenseId'];

    final ok = await kConfirm(
      context,
      'Şoförü Sil',
      '"$name" isimli şoförü silmek istiyor musunuz?',
    );

    if (ok == true) {
      setState(() => _loading = true);
      try {
        if (driverId != null) await _api.deleteDriver(driverId);
        // Optional: delete user or license
        // if (userId != null) await _api.deleteUser(userId);
        // if (lic != null) await _api.deleteLicense(lic);

        if (mounted) {
          kSuccess(context, 'Şoför silindi');
          Navigator.pop(context, true);
        }
      } catch (e) {
        if (mounted) {
          setState(() => _loading = false);
          kError(context, 'Silinemedi: $e');
        }
      }
    }
  }

  // ── Manager name helper ───────────────────────────────────────────────────
  String _managerDisplayName(int managerId) {
    final m = _managers.firstWhere((m) => m['id'] == managerId, orElse: () => <String, dynamic>{});
    if (m.isEmpty) return 'Yönetici #$managerId';
    final uid = m['userId'];
    final u = _users.firstWhere((u) => u['id'] == uid, orElse: () => <String, dynamic>{});
    if (u.isEmpty) return 'Yönetici #$managerId';
    return '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
  }

  Widget _buildManagerAssignment() {
    return Container(
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
            'Yönetici Ataması',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (_currentManagerId != null && !_managerChanged) ...[
            Row(
              children: [
                const Icon(Icons.person, color: Color(0xFF7C3AED)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _managerDisplayName(_currentManagerId!),
                    style: const TextStyle(color: Colors.white, fontSize: 15),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _managerChanged = true;
                      _selectedManagerToAssign = {'id': -1};
                    });
                  },
                  child: const Text('Değiştir', style: TextStyle(color: Colors.orangeAccent)),
                ),
              ],
            ),
          ] else ...[
            DropdownButtonFormField<Map<String, dynamic>?>(
              value: _selectedManagerToAssign?['id'] == -1 ? null : _selectedManagerToAssign,
              dropdownColor: kCard,
              isExpanded: true,
              menuMaxHeight: 300,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Yönetici Seçin'),
              items: [
                const DropdownMenuItem(
                  value: null,
                  child: Text('Yönetici Atanmadı', style: TextStyle(color: kMuted)),
                ),
                ..._managers.map((m) {
                  final uid = m['userId'];
                  final u = _users.firstWhere((u) => u['id'] == uid, orElse: () => <String, dynamic>{});
                  final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                  final dept = m['departmentName'] ?? '';
                  return DropdownMenuItem(
                    value: m,
                    child: Text(dept.isNotEmpty ? '$name ($dept)' : name),
                  );
                }),
              ],
              onChanged: (v) => setState(() {
                _managerChanged = true;
                _selectedManagerToAssign = v;
              }),
            ),
            if (_managerChanged && _currentManagerId != null && (_selectedManagerToAssign == null || _selectedManagerToAssign!['id'] == -1))
              const Padding(
                padding: EdgeInsets.only(top: 8.0),
                child: Text(
                  'Mevcut yönetici ataması kaldırılacak.',
                  style: TextStyle(color: Colors.orangeAccent, fontSize: 12),
                ),
              ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isNew = widget.item == null;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg,
        title: Text(
          isNew ? 'Yeni Şoför Ekle' : 'Şoför Detayı',
          style: const TextStyle(fontSize: 18, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          if (!isNew)
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.redAccent),
              onPressed: _delete,
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kBlue))
          : SingleChildScrollView(
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
                        const Text(
                          'Kimlik ve İletişim',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        kField('Ad *', firstC),
                        kField('Soyad *', lastC),
                        kField(
                          'E-posta',
                          emailC,
                          type: TextInputType.emailAddress,
                        ),
                        kField(
                          'Şifre',
                          passC,
                          obscure: true,
                          hint: isNew ? 'Zorunlu' : 'Değiştirmek için doldurun',
                        ),
                        kField('Telefon', phoneC, type: TextInputType.phone),
                        kField('TC Kimlik No', tcC, type: TextInputType.number),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

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
                        const Text(
                          'Ehliyet Bilgileri',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        kField('Ehliyet No *', licC),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          value: ['B', 'C', 'D', 'E', 'CE'].contains(licType)
                              ? licType
                              : 'B',
                          dropdownColor: kCard,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          decoration: fieldDecor('Ehliyet Tipi *'),
                          items: const [
                            DropdownMenuItem(
                              value: 'B',
                              child: Text('B (Otomobil)'),
                            ),
                            DropdownMenuItem(
                              value: 'C',
                              child: Text('C (Kamyon)'),
                            ),
                            DropdownMenuItem(
                              value: 'D',
                              child: Text('D (Otobüs)'),
                            ),
                            DropdownMenuItem(
                              value: 'E',
                              child: Text('E (Römorklu)'),
                            ),
                            DropdownMenuItem(
                              value: 'CE',
                              child: Text('CE (Tır)'),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => licType = v ?? licType),
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
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Araç Ataması',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_currentlyAssignedPlate != null &&
                            _selectedVehicleToAssign == null) ...[
                          Row(
                            children: [
                              const Icon(
                                Icons.directions_car,
                                color: Colors.blueAccent,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _currentlyAssignedPlate!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _selectedVehicleToAssign = {'plate': '-1'};
                                  });
                                },
                                child: const Text(
                                  'Kaldır',
                                  style: TextStyle(color: Colors.redAccent),
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          DropdownButtonFormField<Map<String, dynamic>?>(
                            value: _selectedVehicleToAssign?['plate'] == '-1'
                                ? null
                                : _selectedVehicleToAssign,
                            dropdownColor: kCard,
                            isExpanded: true,
                            menuMaxHeight: 300,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                            decoration: fieldDecor('Araç Seçin'),
                            items: [
                              const DropdownMenuItem(
                                value: null,
                                child: Text(
                                  'Araç Atanmadı',
                                  style: TextStyle(color: kMuted),
                                ),
                              ),
                              ..._vehicles.map((v) {
                                final p = v['plate'] ?? v['plateNumber'];
                                final dName =
                                    _plateToDriver[p?.toString() ?? ''];
                                return DropdownMenuItem(
                                  value: v,
                                  child: Text(
                                    dName != null ? '$p - $dName' : '$p',
                                  ),
                                );
                              }),
                            ],
                            onChanged: (v) =>
                                setState(() => _selectedVehicleToAssign = v),
                          ),
                          if (_selectedVehicleToAssign?['plate'] == '-1')
                            const Padding(
                              padding: EdgeInsets.only(top: 8.0),
                              child: Text(
                                'Mevcut araç ataması kaldırılacak.',
                                style: TextStyle(
                                  color: Colors.orangeAccent,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Manager Assignment ──
                  _buildManagerAssignment(),
                  const SizedBox(height: 16),

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
                        const Text(
                          'Durum ve Puan',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        kField(
                          'Sürücü Puanı',
                          scoreC,
                          type: TextInputType.number,
                        ),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          value: ['Idle', 'InTrip'].contains(status)
                              ? status
                              : 'Idle',
                          dropdownColor: kCard,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          decoration: fieldDecor('Durum'),
                          items: const [
                            DropdownMenuItem(
                              value: 'Idle',
                              child: Text('Müsait'),
                            ),
                            DropdownMenuItem(
                              value: 'InTrip',
                              child: Text('Seferde'),
                            ),
                          ],
                          onChanged: (v) =>
                              setState(() => status = v ?? status),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: _save,
                      child: Text(
                        isNew ? 'Şoför Ekle' : 'Değişiklikleri Kaydet',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}
