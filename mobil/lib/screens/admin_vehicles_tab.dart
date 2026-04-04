import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminVehiclesTab extends StatefulWidget {
  const AdminVehiclesTab({super.key});
  @override
  State<AdminVehiclesTab> createState() => _State();
}

class _State extends State<AdminVehiclesTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  bool _loading = true;
  final _search = TextEditingController();

  @override void initState() { super.initState(); _load(); }
  @override void dispose()   { _search.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _api.getVehicles();
      if (!mounted) return;
      setState(() { _all = list.cast(); _filter(); _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Yüklenemedi: $e');
    }
  }

  void _filter() {
    final q = _search.text.toLowerCase();
    _shown = q.isEmpty ? List.from(_all) : _all.where((v) =>
      '${v['plateNumber']} ${v['brandModel']}'.toLowerCase().contains(q)).toList();
  }

  String? _dateOf(dynamic val) => val?.toString().split('T').first;

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final plateC = TextEditingController(text: item?['plateNumber'] ?? '');
    final brandC = TextEditingController(text: item?['brandModel'] ?? '');
    final regC   = TextEditingController(text: item?['registrationNumber'] ?? '');
    final yearC  = TextEditingController(text: (item?['year'] ?? DateTime.now().year).toString());
    final capC   = TextEditingController(text: (item?['capacityKg'] ?? 0).toString());
    final priceC = TextEditingController(text: (item?['baseRentPrice'] ?? 0).toString());
    final kmC    = TextEditingController(text: (item?['nextMaintenanceKm'] ?? 0).toString());
    final insSD  = TextEditingController(text: _dateOf(item?['insuranceStartDate']) ?? '');
    final insED  = TextEditingController(text: _dateOf(item?['insuranceEndDate']) ?? '');
    final casSD  = TextEditingController(text: _dateOf(item?['cascoStartDate']) ?? '');
    final casED  = TextEditingController(text: _dateOf(item?['cascoEndDate']) ?? '');
    final inpSD  = TextEditingController(text: _dateOf(item?['inspectionStartDate']) ?? '');
    final inpED  = TextEditingController(text: _dateOf(item?['inspectionEndDate']) ?? '');
    String vType = item?['vehicleType'] ?? 'Kamyon';
    bool active  = item?['isActive'] ?? true;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, ss) => AlertDialog(
        backgroundColor: kCard,
        title: Text(item == null ? 'Yeni Araç Ekle' : 'Araç Düzenle',
            style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SizedBox(width: double.maxFinite, child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Plaka *', plateC),
            kField('Marka / Model *', brandC),
            kField('Ruhsat No', regC),
            kField('Yıl', yearC, type: TextInputType.number),
            kField('Kapasite (kg)', capC, type: TextInputType.number),
            kField('Taban Fiyat (₺)', priceC, type: TextInputType.number),
            kField('Sonraki Bakım KM', kmC, type: TextInputType.number),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: vType, dropdownColor: kCard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Araç Tipi'),
              items: const [
                DropdownMenuItem(value: 'Kamyon',   child: Text('Kamyon')),
                DropdownMenuItem(value: 'TIR',      child: Text('TIR')),
                DropdownMenuItem(value: 'Van',      child: Text('Van')),
                DropdownMenuItem(value: 'Otomobil', child: Text('Otomobil')),
              ],
              onChanged: (v) => ss(() => vType = v ?? vType),
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<bool>(
              value: active, dropdownColor: kCard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Durum'),
              items: const [
                DropdownMenuItem(value: true,  child: Text('Aktif')),
                DropdownMenuItem(value: false, child: Text('Pasif')),
              ],
              onChanged: (v) => ss(() => active = v ?? active),
            ),
            const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(color: kBorder)),
            const Align(alignment: Alignment.centerLeft,
                child: Text('Sigorta / Kasko / Muayene', style: TextStyle(color: kMuted, fontSize: 12))),
            const SizedBox(height: 8),
            kField('Sigorta Başlangıç (YYYY-MM-DD)', insSD),
            kField('Sigorta Bitiş (YYYY-MM-DD)', insED),
            kField('Kasko Başlangıç (YYYY-MM-DD)', casSD),
            kField('Kasko Bitiş (YYYY-MM-DD)', casED),
            kField('Muayene Başlangıç (YYYY-MM-DD)', inpSD),
            kField('Muayene Bitiş (YYYY-MM-DD)', inpED),
          ]),
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () async {
              if (plateC.text.isEmpty || brandC.text.isEmpty) {
                kError(context, 'Plaka ve Marka/Model zorunludur'); return;
              }
              Navigator.pop(ctx);
              String? iso(String s) => s.isEmpty ? null : '${s}T00:00:00.000Z';
              final body = {
                'plateNumber': plateC.text, 'brandModel': brandC.text,
                'registrationNumber': regC.text,
                'year': int.tryParse(yearC.text) ?? DateTime.now().year,
                'vehicleType': vType,
                'capacityKg': int.tryParse(capC.text) ?? 0,
                'baseRentPrice': double.tryParse(priceC.text) ?? 0,
                'nextMaintenanceKm': int.tryParse(kmC.text) ?? 0,
                'isActive': active,
                'insuranceStartDate': iso(insSD.text), 'insuranceEndDate': iso(insED.text),
                'cascoStartDate':     iso(casSD.text), 'cascoEndDate':     iso(casED.text),
                'inspectionStartDate':iso(inpSD.text), 'inspectionEndDate': iso(inpED.text),
              };
              try {
                if (item != null && item['id'] != null) {
                  await _api.updateVehicle(item['id'], body); kSuccess(context, 'Araç güncellendi');
                } else {
                  await _api.createVehicle(body); kSuccess(context, 'Araç eklendi');
                }
                _load();
              } catch (e) { kError(context, 'İşlem başarısız: $e'); }
            },
            child: Text(item == null ? 'Kaydet' : 'Güncelle',
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      )),
    );
    Future.delayed(const Duration(milliseconds: 300), () {
      for (final c in [plateC, brandC, regC, yearC, capC, priceC, kmC, insSD, insED, casSD, casED, inpSD, inpED]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final ok = await kConfirm(context, 'Araç Sil',
        '"${item['plateNumber']}" plakalı aracı silmek istiyor musunuz?');
    if (ok == true) {
      try { await _api.deleteVehicle(item['id']); kSuccess(context, 'Silindi'); _load(); }
      catch (e) { kError(context, 'Silinemedi: $e'); }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Container(
        color: kBg,
        child: Column(children: [
          Padding(padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search, style: const TextStyle(color: Colors.white),
              decoration: fieldDecor('Araç ara...').copyWith(
                  prefixIcon: const Icon(Icons.search, color: kMuted, size: 20)),
              onChanged: (_) => setState(_filter),
            )),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator(color: kBlue)))
          else
            Expanded(child: _shown.isEmpty
                ? const Center(child: Text('Kayıtlı araç yok.', style: TextStyle(color: kMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                    itemCount: _shown.length,
                    itemBuilder: (_, i) {
                      final v = _shown[i];
                      final active = v['isActive'] == true;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: kCard,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: kBorder)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(v['plateNumber'] ?? '—',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15))),
                            kBadge(active ? 'Aktif' : 'Pasif', active ? Colors.green : Colors.grey),
                          ]),
                          const SizedBox(height: 4),
                          Text('${v['brandModel'] ?? '—'}  ·  ${v['year'] ?? '—'}  ·  ${v['vehicleType'] ?? '—'}',
                              style: const TextStyle(color: kMuted, fontSize: 12)),
                          Text('Kasko: ${_dateOf(v['cascoEndDate']) ?? '—'}  ·  Sigorta: ${_dateOf(v['insuranceEndDate']) ?? '—'}',
                              style: const TextStyle(color: kMuted, fontSize: 11)),
                          const SizedBox(height: 8),
                          kActions(() => _openForm(item: v), () => _delete(v)),
                        ]),
                      );
                    })),
        ]),
      ),
      Positioned(
        right: 16, bottom: 24,
        child: FloatingActionButton.extended(
          backgroundColor: kBlue, onPressed: () => _openForm(),
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Araç Ekle', style: TextStyle(color: Colors.white)),
        ),
      ),
    ]);
  }
}
