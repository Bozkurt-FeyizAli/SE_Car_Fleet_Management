import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminCompaniesTab extends StatefulWidget {
  const AdminCompaniesTab({super.key});
  @override
  State<AdminCompaniesTab> createState() => _State();
}

class _State extends State<AdminCompaniesTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  bool _loading = true;
  final _search = TextEditingController();

  @override void initState() { super.initState(); _load(); }
  @override void dispose()   { _search.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _api.getCompanies();
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
    _shown = q.isEmpty ? List.from(_all) : _all.where((c) =>
      '${c['name']} ${c['taxNumber']} ${c['email']}'.toLowerCase().contains(q)).toList();
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final nameC = TextEditingController(text: item?['name'] ?? '');
    final taxC  = TextEditingController(text: item?['taxNumber'] ?? '');
    final emailC= TextEditingController(text: item?['email'] ?? '');
    final phoneC= TextEditingController(text: item?['phone'] ?? '');
    final addrC = TextEditingController(text: item?['address'] ?? '');
    final webC  = TextEditingController(text: item?['website'] ?? '');
    final contC = TextEditingController(text: item?['contactPerson'] ?? '');
    String status = item?['status'] ?? 'active';

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, ss) => AlertDialog(
        backgroundColor: kCard,
        title: Text(item == null ? 'Yeni Şirket Ekle' : 'Şirket Düzenle',
            style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SizedBox(width: double.maxFinite, child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Şirket Adı *', nameC),
            kField('Vergi Numarası *', taxC),
            kField('E-posta *', emailC, type: TextInputType.emailAddress),
            kField('Telefon', phoneC, type: TextInputType.phone),
            kField('Adres', addrC),
            kField('Website', webC),
            kField('İletişim Kişisi', contC),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: status, dropdownColor: kCard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Durum'),
              items: const [
                DropdownMenuItem(value: 'active',    child: Text('Aktif')),
                DropdownMenuItem(value: 'suspended', child: Text('Askıda')),
                DropdownMenuItem(value: 'passive',   child: Text('Pasif')),
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
              if (nameC.text.isEmpty || taxC.text.isEmpty || emailC.text.isEmpty) {
                kError(context, 'Zorunlu alanları doldurun'); return;
              }
              Navigator.pop(ctx);
              final body = {
                'name': nameC.text, 'taxNumber': taxC.text, 'email': emailC.text,
                'phone': phoneC.text, 'address': addrC.text, 'website': webC.text,
                'contactPerson': contC.text, 'status': status,
                'fleetSize': 0, 'subscriptionPlan': 'basic',
              };
              try {
                if (item != null) {
                  await _api.updateCompany(item['id'], body);
                  kSuccess(context, 'Şirket güncellendi');
                } else {
                  await _api.createCompany(body);
                  kSuccess(context, 'Şirket eklendi');
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
      for (final c in [nameC, taxC, emailC, phoneC, addrC, webC, contC]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final ok = await kConfirm(context, 'Şirket Sil',
        '"${item['name']}" şirketini silmek istiyor musunuz?');
    if (ok == true) {
      try { await _api.deleteCompany(item['id']); kSuccess(context, 'Silindi'); _load(); }
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
              decoration: fieldDecor('Şirket ara...').copyWith(
                  prefixIcon: const Icon(Icons.search, color: kMuted, size: 20)),
              onChanged: (_) => setState(_filter),
            )),
          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator(color: kBlue)))
          else
            Expanded(child: _shown.isEmpty
                ? const Center(child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                    itemCount: _shown.length,
                    itemBuilder: (_, i) {
                      final c = _shown[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: kCard,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: kBorder)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(c['name'] ?? '—',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14))),
                            kBadge(kStatusLabel(c['status']), kStatusColor(c['status'])),
                          ]),
                          const SizedBox(height: 4),
                          Text(c['email'] ?? '—', style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 12)),
                          Text('VKN: ${c['taxNumber'] ?? '—'}  ·  ${c['contactPerson'] ?? ''}',
                              style: const TextStyle(color: kMuted, fontSize: 11)),
                          const SizedBox(height: 8),
                          kActions(() => _openForm(item: c), () => _delete(c)),
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
          label: const Text('Şirket Ekle', style: TextStyle(color: Colors.white)),
        ),
      ),
    ]);
  }
}
