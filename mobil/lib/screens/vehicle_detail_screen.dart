import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class VehicleDetailScreen extends StatefulWidget {
  final UserModel user;
  final Map<String, dynamic>? item;

  const VehicleDetailScreen({super.key, required this.user, this.item});

  @override
  State<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends State<VehicleDetailScreen> {
  final _api = ApiService();
  bool _loading = false;

  late TextEditingController plateC;
  late TextEditingController brandC;
  late TextEditingController regC;
  late TextEditingController yearC;
  late TextEditingController capC;
  late TextEditingController priceC;
  late TextEditingController kmC;
  late TextEditingController compIdC;
  late TextEditingController insSD;
  late TextEditingController insED;
  late TextEditingController casSD;
  late TextEditingController casED;
  late TextEditingController inpSD;
  late TextEditingController inpED;
  
  String vType = 'Kamyon';
  bool active = true;

  List<Map<String, dynamic>> _drivers = [];
  Map<String, dynamic>? _assignedDriver;
  Map<String, dynamic>? _selectedDriverToAssign;

  @override
  void initState() {
    super.initState();
    final item = widget.item;

    String? dateOf(dynamic val) => val?.toString().split('T').first;

    plateC = TextEditingController(text: item?['plate'] ?? item?['plateNumber'] ?? '');
    brandC = TextEditingController(text: item?['brandModel'] ?? '');
    regC = TextEditingController(text: item?['registrationNumber'] ?? '');
    yearC = TextEditingController(text: (item?['year'] ?? DateTime.now().year).toString());
    capC = TextEditingController(text: (item?['capacityKg'] ?? item?['capacity'] ?? 0).toString());
    priceC = TextEditingController(text: (item?['baseRentPrice'] ?? 0).toString());
    kmC = TextEditingController(text: (item?['nextMaintenanceKm'] ?? 0).toString());
    compIdC = TextEditingController(text: (item?['companyId'] ?? widget.user.companyId ?? 1).toString());
    
    insSD = TextEditingController(text: dateOf(item?['insuranceStartDate']) ?? '');
    insED = TextEditingController(text: dateOf(item?['insuranceEndDate']) ?? '');
    casSD = TextEditingController(text: dateOf(item?['cascoStartDate']) ?? '');
    casED = TextEditingController(text: dateOf(item?['cascoEndDate']) ?? '');
    inpSD = TextEditingController(text: dateOf(item?['inspectionStartDate']) ?? '');
    inpED = TextEditingController(text: dateOf(item?['inspectionEndDate']) ?? '');
    
    vType = item?['vehicleType'] ?? item?['type'] ?? 'Kamyon';
    active = item?['isActive'] ?? true;

    _loadDrivers();
  }

  Future<void> _loadDrivers() async {
    try {
      final res = await _api.getDrivers();
      final list = res.cast<Map<String, dynamic>>();
      if (!mounted) return;

      setState(() {
        _drivers = list;
        if (widget.item != null) {
          final plate = widget.item!['plate'] ?? widget.item!['plateNumber'];
          final matching = _drivers.where((d) => d['vehiclePlate'] == plate);
          _assignedDriver = matching.isNotEmpty ? matching.first : null;
        }
      });
    } catch (e) {
      // Ignore gracefully
    }
  }

  @override
  void dispose() {
    plateC.dispose();
    brandC.dispose();
    regC.dispose();
    yearC.dispose();
    capC.dispose();
    priceC.dispose();
    kmC.dispose();
    compIdC.dispose();
    insSD.dispose();
    insED.dispose();
    casSD.dispose();
    casED.dispose();
    inpSD.dispose();
    inpED.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (plateC.text.isEmpty || brandC.text.isEmpty) {
      kError(context, 'Plaka ve Marka/Model zorunludur');
      return;
    }

    setState(() => _loading = true);

    String iso(String s) => s.isEmpty ? DateTime.now().toUtc().toIso8601String() : '${s}T00:00:00.000Z';

    final regBody = {
      'registrationNumber': regC.text,
      'brandModel': brandC.text,
      'year': int.tryParse(yearC.text) ?? DateTime.now().year,
      'type': vType,
      'capacity': int.tryParse(capC.text) ?? 0,
    };

    final vBody = {
      'plate': plateC.text,
      'registrationNumber': regC.text,
      'currentKm': (widget.item?['currentKm'] ?? 0).toDouble(),
      'baseRentPrice': double.tryParse(priceC.text) ?? 0.0,
      'insuranceEndDate': iso(insED.text),
      'cascoEndDate': iso(casED.text),
      'inspectionEndDate': iso(inpED.text),
      'nextMaintenanceKm': int.tryParse(kmC.text) ?? 0,
      'isActive': active,
      'companyId': int.tryParse(compIdC.text) ?? widget.user.companyId ?? 1,
      'damageRecordAmount': (widget.item?['damageRecordAmount'] ?? 0).toDouble(),
    };

    try {
      final oldPlate = widget.item?['plate'] ?? widget.item?['plateNumber'];
      final oldReg = widget.item?['registrationNumber'];
      
      if (widget.item != null && oldPlate != null && oldReg != null) {
        await _api.updateVehicleRegistration(oldReg, regBody);
        await _api.updateVehicle(oldPlate, vBody);
        
        // Handle driver assignment
        if (_selectedDriverToAssign != null) {
          if (_assignedDriver != null && _assignedDriver!['id'] != _selectedDriverToAssign!['id']) {
            await _unassignDriver(_assignedDriver!);
          }
          if (_selectedDriverToAssign!['id'] == -1 && _assignedDriver != null) {
            await _unassignDriver(_assignedDriver!);
          } else if (_selectedDriverToAssign!['id'] != -1) {
            await _assignDriverToVehicle(_selectedDriverToAssign!, plateC.text);
          }
        }
        
        if (mounted) kSuccess(context, 'Araç güncellendi');
      } else {
        await _api.createVehicleRegistration(regBody);
        await _api.createVehicle(vBody);
        
        if (_selectedDriverToAssign != null && _selectedDriverToAssign!['id'] != -1) {
          await _assignDriverToVehicle(_selectedDriverToAssign!, plateC.text);
        }
        
        if (mounted) kSuccess(context, 'Araç eklendi');
      }
      
      if (mounted) Navigator.pop(context, true); // true indicates changes were made
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        kError(context, 'İşlem başarısız: $e');
      }
    }
  }

  Future<void> _delete() async {
    if (widget.item == null) return;

    final plate = widget.item!['plate'] ?? widget.item!['plateNumber'];
    final reg = widget.item!['registrationNumber'];
    
    final ok = await kConfirm(
      context,
      'Araç Sil',
      '"$plate" plakalı aracı silmek istiyor musunuz?',
    );
    
    if (ok == true) {
      setState(() => _loading = true);
      try {
        if (plate != null) await _api.deleteVehicle(plate);
        if (reg != null) await _api.deleteVehicleRegistration(reg);
        
        if (mounted) {
          kSuccess(context, 'Araç silindi');
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

  Future<void> _unassignDriver(Map<String, dynamic> driver) async {
    final driverBody = <String, dynamic>{
      ...driver,
      'vehiclePlate': null,
    };
    await _api.updateDriver(driver['id'], driverBody);
  }

  Future<void> _assignDriverToVehicle(Map<String, dynamic> driver, String plate) async {
    final driverBody = <String, dynamic>{
      ...driver,
      'vehiclePlate': plate,
    };
    await _api.updateDriver(driver['id'], driverBody);
  }

  @override
  Widget build(BuildContext context) {
    final isNew = widget.item == null;
    final isRented = widget.item?['isRentedOut'] == true || widget.item?['isRentedIn'] == true;

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg,
        title: Text(isNew ? 'Yeni Araç Ekle' : 'Araç Detayı', style: const TextStyle(fontSize: 18, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          if (!isNew && !isRented)
            IconButton(
              icon: const Icon(Icons.delete, color: Colors.redAccent),
              onPressed: _delete,
            )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kBlue))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isRented)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orangeAccent),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.orangeAccent),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Bu araç şu anda kiralık statüsünde olduğu için bilgileri düzenlenemez.',
                              style: TextStyle(color: Colors.orangeAccent, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  
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
                        const Text('Temel Bilgiler', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        kField('Plaka *', plateC, enabled: !isRented),
                        kField('Marka / Model *', brandC, enabled: !isRented),
                        kField('Ruhsat No', regC, enabled: !isRented),
                        kField('Yıl', yearC, type: TextInputType.number, enabled: !isRented),
                        kField('Kapasite (kg)', capC, type: TextInputType.number, enabled: !isRented),
                        kField('Taban Fiyat (₺)', priceC, type: TextInputType.number, enabled: !isRented),
                        kField('Sonraki Bakım KM', kmC, type: TextInputType.number, enabled: !isRented),
                        if (widget.user.role == UserRole.superAdmin)
                          kField('Şirket ID', compIdC, type: TextInputType.number, enabled: !isRented),
                        
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: ['Kamyon', 'TIR', 'Van', 'Otomobil'].contains(vType) ? vType : 'Kamyon',
                          dropdownColor: kCard,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: fieldDecor('Araç Tipi'),
                          items: const [
                            DropdownMenuItem(value: 'Kamyon', child: Text('Kamyon')),
                            DropdownMenuItem(value: 'TIR', child: Text('TIR')),
                            DropdownMenuItem(value: 'Van', child: Text('Van')),
                            DropdownMenuItem(value: 'Otomobil', child: Text('Otomobil')),
                          ],
                          onChanged: isRented ? null : (v) => setState(() => vType = v ?? vType),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<bool>(
                          value: active,
                          dropdownColor: kCard,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: fieldDecor('Durum'),
                          items: const [
                            DropdownMenuItem(value: true, child: Text('Aktif')),
                            DropdownMenuItem(value: false, child: Text('Pasif')),
                          ],
                          onChanged: isRented ? null : (v) => setState(() => active = v ?? active),
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
                        const Text('Şoför Ataması', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        if (_assignedDriver != null && _selectedDriverToAssign == null) ...[
                          Row(
                            children: [
                              const Icon(Icons.person, color: Colors.blueAccent),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _assignedDriver!['driverName'] ?? 'İsimsiz Şoför',
                                  style: const TextStyle(color: Colors.white, fontSize: 15),
                                ),
                              ),
                              if (!isRented)
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _selectedDriverToAssign = {'id': -1}; // Special marker to unassign on save
                                    });
                                  },
                                  child: const Text('Kaldır', style: TextStyle(color: Colors.redAccent)),
                                )
                            ],
                          )
                        ] else ...[
                          DropdownButtonFormField<Map<String, dynamic>?>(
                            value: _selectedDriverToAssign?['id'] == -1 ? null : _selectedDriverToAssign,
                            dropdownColor: kCard,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: fieldDecor('Şoför Seçin'),
                            items: [
                              const DropdownMenuItem(value: null, child: Text('Şoför Atanmadı', style: TextStyle(color: kMuted))),
                              ..._drivers.map((d) => DropdownMenuItem(
                                value: d,
                                child: Text('${d['driverName']} ${d['vehiclePlate'] != null ? '(${d['vehiclePlate']})' : ''}'),
                              )),
                            ],
                            onChanged: isRented ? null : (v) => setState(() => _selectedDriverToAssign = v),
                          ),
                          if (_selectedDriverToAssign?['id'] == -1)
                            const Padding(
                              padding: EdgeInsets.only(top: 8.0),
                              child: Text('Şoför kaldırılacak.', style: TextStyle(color: Colors.orangeAccent, fontSize: 12)),
                            )
                        ]
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
                        const Text('Sigorta / Kasko / Muayene', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        kField('Sigorta Başlangıç (YYYY-MM-DD)', insSD, enabled: !isRented),
                        kField('Sigorta Bitiş (YYYY-MM-DD)', insED, enabled: !isRented),
                        kField('Kasko Başlangıç (YYYY-MM-DD)', casSD, enabled: !isRented),
                        kField('Kasko Bitiş (YYYY-MM-DD)', casED, enabled: !isRented),
                        kField('Muayene Başlangıç (YYYY-MM-DD)', inpSD, enabled: !isRented),
                        kField('Muayene Bitiş (YYYY-MM-DD)', inpED, enabled: !isRented),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  if (!isRented)
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kBlue,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _save,
                        child: Text(isNew ? 'Araç Ekle' : 'Değişiklikleri Kaydet', style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}
