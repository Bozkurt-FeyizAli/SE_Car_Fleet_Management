import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// System Admin Vehicles Tab — shows ALL vehicles across all companies
// Separate from AdminVehiclesTab used by company managers
// ══════════════════════════════════════════════════════════════════════════════

class SysAdminVehiclesTab extends StatefulWidget {
  final UserModel user;
  const SysAdminVehiclesTab({super.key, required this.user});
  @override
  State<SysAdminVehiclesTab> createState() => _State();
}

class _State extends State<SysAdminVehiclesTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  Map<int, String> _companyNames = {};
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
        _api.getCompanies().catchError((_) => <dynamic>[]),
        _api.getAllRentals().catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;

      final vList = (results[0] as List).cast<Map<String, dynamic>>();
      final rList = (results[1] as List).cast<Map<String, dynamic>>();
      final companies = (results[2] as List).cast<Map<String, dynamic>>();
      final rentals = (results[3] as List).cast<Map<String, dynamic>>();

      // Build company name map
      final cMap = <int, String>{};
      for (final c in companies) {
        final id = (c['id'] as num?)?.toInt();
        if (id != null) cMap[id] = c['companyName'] ?? c['name'] ?? '—';
      }

      // Build registration map
      final regMap = <String, Map<String, dynamic>>{};
      for (final r in rList) {
        regMap[r['registrationNumber'] ?? ''] = r;
      }

      // Build active rental map by plate
      final rentalMap = <String, Map<String, dynamic>>{};
      for (final r in rentals) {
        if (r['isCompleted'] == false) {
          final plate = r['vehiclePlate'];
          if (plate != null) rentalMap[plate] = r;
        }
      }

      // Enrich vehicle list
      for (var v in vList) {
        final reg = regMap[v['registrationNumber']];
        if (reg != null) {
          v['brandModel'] = reg['brandModel'];
          v['year'] = reg['year'];
          v['vehicleType'] = reg['type'];
          v['capacityKg'] = reg['capacity'];
        }

        final plate = v['plate'] ?? v['plateNumber'];
        final rental = rentalMap[plate];
        if (rental != null) {
          v['isRented'] = true;
          v['renterCompanyId'] = rental['renterCompanyId'];
          v['ownerCompanyId'] = rental['ownerCompanyId'];
        } else {
          v['isRented'] = false;
        }
      }

      setState(() {
        _all = vList;
        _companyNames = cMap;
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
      if (q.isNotEmpty) {
        final searchStr = '${v['plate'] ?? ''} ${v['brandModel'] ?? ''}'.toLowerCase();
        if (!searchStr.contains(q)) return false;
      }
      switch (_statusFilter) {
        case 'Aktif': return v['isActive'] == true;
        case 'Pasif': return v['isActive'] != true;
        case 'Kiralık': return v['isRented'] == true;
        default: return true;
      }
    }).toList();
  }

  String? _dateOf(dynamic val) => val?.toString().split('T').first;

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final isNew = item == null;
    final plateC = TextEditingController(text: item?['plate'] ?? item?['plateNumber'] ?? '');
    final regC = TextEditingController(text: item?['registrationNumber'] ?? '');
    final brandC = TextEditingController(text: item?['brandModel'] ?? '');
    final yearC = TextEditingController(text: (item?['year'] ?? DateTime.now().year).toString());
    final typeC = TextEditingController(text: item?['vehicleType'] ?? item?['type'] ?? '');
    final capC = TextEditingController(text: (item?['capacityKg'] ?? item?['capacity'] ?? 0).toString());
    final priceC = TextEditingController(text: (item?['baseRentPrice'] ?? 0).toString());
    final kmC = TextEditingController(text: (item?['nextMaintenanceKm'] ?? 0).toString());
    int companyId = (item?['companyId'] as num?)?.toInt() ?? 1;
    bool active = item?['isActive'] ?? true;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isNew ? 'Yeni Araç Ekle' : 'Araç Düzenle',
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 16),
                kField('Plaka *', plateC),
                kField('Ruhsat No *', regC),
                kField('Marka / Model *', brandC),
                kField('Yıl', yearC, type: TextInputType.number),
                kField('Araç Tipi', typeC),
                kField('Kapasite (kg)', capC, type: TextInputType.number),
                kField('Kiralama Fiyatı (₺)', priceC, type: TextInputType.number),
                kField('Sonraki Bakım KM', kmC, type: TextInputType.number),
                const SizedBox(height: 4),
                DropdownButtonFormField<int>(
                  value: _companyNames.containsKey(companyId) ? companyId : null,
                  dropdownColor: kCard,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: fieldDecor('Sahip Şirket'),
                  items: _companyNames.entries.map((e) =>
                    DropdownMenuItem(value: e.key, child: Text(e.value)),
                  ).toList(),
                  onChanged: (v) => setSt(() => companyId = v ?? companyId),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  title: const Text('Aktif mi?', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: active,
                  activeColor: kBlue,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (v) => setSt(() => active = v),
                ),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: kBlue),
                      onPressed: () async {
                        if (plateC.text.isEmpty || regC.text.isEmpty || brandC.text.isEmpty) {
                          kError(ctx, 'Plaka, Ruhsat No ve Marka zorunludur');
                          return;
                        }
                        try {
                          final regBody = {
                            'registrationNumber': regC.text,
                            'brandModel': brandC.text,
                            'year': int.tryParse(yearC.text) ?? DateTime.now().year,
                            'type': typeC.text.isEmpty ? 'Kamyon' : typeC.text,
                            'capacity': int.tryParse(capC.text) ?? 0,
                          };
                          String iso(String s) => s.isEmpty
                              ? DateTime.now().toUtc().toIso8601String()
                              : '${s}T00:00:00.000Z';
                          final vBody = {
                            'plate': plateC.text,
                            'registrationNumber': regC.text,
                            'currentKm': (item?['currentKm'] ?? 0).toDouble(),
                            'baseRentPrice': double.tryParse(priceC.text) ?? 0.0,
                            'insuranceEndDate': iso(_dateOf(item?['insuranceEndDate']) ?? ''),
                            'cascoEndDate': iso(_dateOf(item?['cascoEndDate']) ?? ''),
                            'inspectionEndDate': iso(_dateOf(item?['inspectionEndDate']) ?? ''),
                            'nextMaintenanceKm': int.tryParse(kmC.text) ?? 0,
                            'isActive': active,
                            'companyId': companyId,
                            'damageRecordAmount': (item?['damageRecordAmount'] ?? 0).toDouble(),
                          };

                          if (isNew) {
                            await _api.createVehicleRegistration(regBody);
                            await _api.createVehicle(vBody);
                            if (ctx.mounted) kSuccess(context, 'Araç eklendi');
                          } else {
                            final oldReg = item['registrationNumber'];
                            final oldPlate = item['plate'] ?? item['plateNumber'];
                            if (oldReg != null) await _api.updateVehicleRegistration(oldReg, regBody);
                            if (oldPlate != null) await _api.updateVehicle(oldPlate, vBody);
                            if (ctx.mounted) kSuccess(context, 'Araç güncellendi');
                          }
                          if (ctx.mounted) Navigator.pop(ctx);
                          _load();
                        } catch (e) {
                          if (ctx.mounted) kError(ctx, 'Hata: $e');
                        }
                      },
                      child: Text(isNew ? 'Ekle' : 'Güncelle', style: const TextStyle(color: Colors.white)),
                    ),
                  ),
                ]),
                if (!isNew) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.redAccent),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        final ok = await kConfirm(context, 'Araç Sil',
                            '"${plateC.text}" plakalı aracı silmek istiyor musunuz?');
                        if (ok == true) {
                          try {
                            final plate = item['plate'] ?? item['plateNumber'];
                            final reg = item['registrationNumber'];
                            if (plate != null) await _api.deleteVehicle(plate);
                            if (reg != null) await _api.deleteVehicleRegistration(reg);
                            kSuccess(context, 'Araç silindi');
                            _load();
                          } catch (e) {
                            kError(context, 'Silinemedi: $e');
                          }
                        }
                      },
                      icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.redAccent),
                      label: const Text('Aracı Sil', style: TextStyle(color: Colors.redAccent)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
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
                          prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
                        ),
                        onChanged: (_) => setState(_filter),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 3,
                      child: DropdownButtonFormField<String>(
                        value: _statusFilter,
                        isExpanded: true,
                        dropdownColor: kCard,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: fieldDecor('Durum'),
                        items: const [
                          DropdownMenuItem(value: 'Tümü', child: Text('Tümü')),
                          DropdownMenuItem(value: 'Aktif', child: Text('Aktif')),
                          DropdownMenuItem(value: 'Pasif', child: Text('Pasif')),
                          DropdownMenuItem(value: 'Kiralık', child: Text('Kiralık')),
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
                          child: Text('Kayıtlı araç yok.', style: TextStyle(color: kMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) {
                            final v = _shown[i];
                            final plate = (v['plate'] ?? v['plateNumber'] ?? '—').toString();
                            final brand = v['brandModel'] ?? '—';
                            final year = v['year'] ?? '—';
                            final cId = (v['companyId'] as num?)?.toInt();
                            final ownerName = cId != null ? (_companyNames[cId] ?? '—') : '—';
                            final isActive = v['isActive'] == true;
                            final isRented = v['isRented'] == true;

                            String? renterName;
                            if (isRented) {
                              final rCid = (v['renterCompanyId'] as num?)?.toInt();
                              if (rCid != null) renterName = _companyNames[rCid];
                            }

                            return InkWell(
                              onTap: () => _openForm(item: v),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: kCard,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kBorder),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                plate,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              if (isRented)
                                                kBadge('Kiralık', Colors.orange)
                                              else if (isActive)
                                                kBadge('Aktif', kGreen)
                                              else
                                                kBadge('Pasif', kMuted),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '$brand · $year',
                                            style: const TextStyle(color: kMuted, fontSize: 11),
                                          ),
                                          Text(
                                            'Sahip: $ownerName',
                                            style: const TextStyle(color: kBlue, fontSize: 11),
                                          ),
                                          if (renterName != null)
                                            Text(
                                              'Kiralayan: $renterName',
                                              style: const TextStyle(color: Colors.orange, fontSize: 11),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right_rounded, color: kMuted, size: 20),
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
            onPressed: () => _openForm(),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('Araç Ekle', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }
}
