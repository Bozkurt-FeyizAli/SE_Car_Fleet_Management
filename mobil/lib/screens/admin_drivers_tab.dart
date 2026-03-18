import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminDriversTab extends StatefulWidget {
  const AdminDriversTab({super.key});
  @override
  State<AdminDriversTab> createState() => _State();
}

class _State extends State<AdminDriversTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  bool _loading = true;
  final _search = TextEditingController();

  @override void initState() { super.initState(); _load(); }
  @override void dispose()   { _search.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _api.getUsers();
      if (!mounted) return;
      setState(() {
        _all = list.cast<Map<String, dynamic>>().where((u) => (u['roleId'] as num?)?.toInt() == 3).toList();
        _filter(); _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Yüklenemedi: $e');
    }
  }

  void _filter() {
    final q = _search.text.toLowerCase();
    _shown = q.isEmpty ? List.from(_all) : _all.where((d) =>
      '${d['firstName']} ${d['lastName']} ${d['driverLicenseId']}'.toLowerCase().contains(q)).toList();
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final firstC  = TextEditingController(text: item?['firstName'] ?? '');
    final lastC   = TextEditingController(text: item?['lastName'] ?? '');
    final emailC  = TextEditingController(text: item?['email'] ?? '');
    final passC   = TextEditingController();
    final phoneC  = TextEditingController(text: item?['phone'] ?? '');
    final tcC     = TextEditingController(text: item?['tcIdentityNumber'] ?? '');
    final licC    = TextEditingController(text: item?['driverLicenseId'] ?? '');
    final scoreC  = TextEditingController(text: (item?['driverScore'] ?? 80).toString());
    String status = item?['driverTripStatus'] ?? 'active';

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, ss) => AlertDialog(
        backgroundColor: kCard,
        title: Text(item == null ? 'Yeni Şoför Ekle' : 'Şoför Düzenle',
            style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SizedBox(width: double.maxFinite, child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Ad *', firstC),
            kField('Soyad *', lastC),
            kField('E-posta', emailC, type: TextInputType.emailAddress),
            kField('Şifre', passC, obscure: true),
            kField('Telefon', phoneC, type: TextInputType.phone),
            kField('TC Kimlik No', tcC, type: TextInputType.number),
            kField('Ehliyet No *', licC),
            kField('Sürücü Puanı', scoreC, type: TextInputType.number),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: status, dropdownColor: kCard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Durum'),
              items: const [
                DropdownMenuItem(value: 'active',   child: Text('Aktif')),
                DropdownMenuItem(value: 'on_trip',  child: Text('Seferde')),
                DropdownMenuItem(value: 'off_duty', child: Text('İzinli')),
                DropdownMenuItem(value: 'inactive', child: Text('Pasif')),
              ],
              onChanged: (v) => ss(() => status = v ?? status),
            ),
          ]),
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () async {
              if (firstC.text.isEmpty || lastC.text.isEmpty) {
                kError(context, 'Ad ve Soyad zorunludur'); return;
              }
              Navigator.pop(ctx);
              final body = <String, dynamic>{
                'firstName': firstC.text, 'lastName': lastC.text,
                'email': emailC.text, 'roleId': 3, 'phone': phoneC.text,
                'tcIdentityNumber': tcC.text, 'driverLicenseId': licC.text,
                'driverScore': int.tryParse(scoreC.text) ?? 80,
                'driverTripStatus': status, 'parentUserId': null,
                'criminalRecord': null, 'assignedVehicleId': null,
                if (passC.text.isNotEmpty) 'passwordHash': passC.text,
              };
              try {
                if (item != null && item['id'] != null) {
                  await _api.updateUser(item['id'], body); kSuccess(context, 'Şoför güncellendi');
                } else {
                  await _api.createUser(body); kSuccess(context, 'Şoför eklendi');
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
      for (final c in [firstC, lastC, emailC, passC, phoneC, tcC, licC, scoreC]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final name = '${item['firstName']} ${item['lastName']}'.trim();
    final ok = await kConfirm(context, 'Şoför Sil', '"$name" şoförü silmek istiyor musunuz?');
    if (ok == true) {
      try { await _api.deleteUser(item['id']); kSuccess(context, 'Silindi'); _load(); }
      catch (e) { kError(context, 'Silinemedi: $e'); }
    }
  }

  Color _scoreColor(int? s) =>
      (s ?? 0) >= 80 ? Colors.green : (s ?? 0) >= 60 ? Colors.orange : Colors.red;

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Container(
        color: kBg,
        child: Column(children: [
          Padding(padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search, style: const TextStyle(color: Colors.white),
              decoration: fieldDecor('Şoför ara...').copyWith(
                  prefixIcon: const Icon(Icons.search, color: kMuted, size: 20)),
              onChanged: (_) => setState(_filter),
            )),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator(color: kBlue)))
          else
            Expanded(child: _shown.isEmpty
                ? const Center(child: Text('Kayıtlı şoför yok.', style: TextStyle(color: kMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                    itemCount: _shown.length,
                    itemBuilder: (_, i) {
                      final d = _shown[i];
                      final name = '${d['firstName'] ?? ''} ${d['lastName'] ?? ''}'.trim();
                      final score = (d['driverScore'] as num?)?.toInt();
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: kCard,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: kBorder)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(name.isEmpty ? '(isimsiz)' : name,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14))),
                            kBadge(kStatusLabel(d['driverTripStatus']), kStatusColor(d['driverTripStatus'])),
                          ]),
                          const SizedBox(height: 4),
                          Row(children: [
                            Text('Ehliyet: ${d['driverLicenseId'] ?? '—'}',
                                style: const TextStyle(color: kMuted, fontSize: 12)),
                            const SizedBox(width: 12),
                            const Text('Puan: ', style: TextStyle(color: kMuted, fontSize: 12)),
                            Text('${score ?? '—'}',
                                style: TextStyle(color: _scoreColor(score), fontSize: 12, fontWeight: FontWeight.w700)),
                          ]),
                          const SizedBox(height: 8),
                          kActions(() => _openForm(item: d), () => _delete(d)),
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
          label: const Text('Şoför Ekle', style: TextStyle(color: Colors.white)),
        ),
      ),
    ]);
  }
}
