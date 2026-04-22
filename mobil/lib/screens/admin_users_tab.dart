import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminUsersTab extends StatefulWidget {
  const AdminUsersTab({super.key});
  @override
  State<AdminUsersTab> createState() => _State();
}

class _State extends State<AdminUsersTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  bool _loading = true;
  final _search = TextEditingController();

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
      final list = await _api.getUsers();
      if (!mounted) return;
      setState(() {
        _all = list.cast();
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
    _shown = q.isEmpty
        ? List.from(_all)
        : _all
              .where(
                (u) => '${u['firstName']} ${u['lastName']} ${u['email']}'
                    .toLowerCase()
                    .contains(q),
              )
              .toList();
  }

  String _roleLabel(int? id) {
    switch (id) {
      case 0:
        return 'Sistem Yöneticisi';
      case 1:
        return 'Şirket Yöneticisi';
      case 2:
        return 'Şoför';
      default:
        return 'Bilinmeyen';
    }
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final firstC = TextEditingController(text: item?['firstName'] ?? '');
    final lastC = TextEditingController(text: item?['lastName'] ?? '');
    final emailC = TextEditingController(text: item?['email'] ?? '');
    final passC = TextEditingController();
    final phoneC = TextEditingController(text: item?['phone'] ?? '');
    final tcC = TextEditingController(text: item?['tcIdentityNumber'] ?? '');
    int roleId = item?['role'] ?? item?['roleId'] ?? 2;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => AlertDialog(
          backgroundColor: kCard,
          title: Text(
            item == null ? 'Yeni Kullanıcı' : 'Kullanıcı Düzenle',
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  kField('Ad *', firstC),
                  kField('Soyad', lastC),
                  kField('E-posta *', emailC, type: TextInputType.emailAddress),
                  kField('Şifre', passC, obscure: true),
                  kField('Telefon', phoneC, type: TextInputType.phone),
                  kField('T.C. Kimlik No *', tcC, type: TextInputType.number),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<int>(
                    initialValue: roleId == 3 ? 2 : roleId, // default 2
                    dropdownColor: kCard,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: fieldDecor('Rol'),
                    items: const [
                      DropdownMenuItem(value: 0, child: Text('Sistem Yöneticisi')),
                      DropdownMenuItem(value: 1, child: Text('Şirket Yöneticisi')),
                      DropdownMenuItem(value: 2, child: Text('Şoför')),
                    ],
                    onChanged: (v) => ss(() => roleId = v ?? roleId),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('İptal', style: TextStyle(color: kMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kBlue),
              onPressed: () async {
                if (firstC.text.isEmpty || emailC.text.isEmpty || tcC.text.isEmpty) {
                  kError(context, 'Ad, E-posta ve TC zorunludur');
                  return;
                }
                Navigator.pop(ctx);
                final body = <String, dynamic>{
                  'firstName': firstC.text,
                  'lastName': lastC.text,
                  'email': emailC.text,
                  'role': roleId,
                  'phoneNumber': phoneC.text,
                  'tcIdentityNumber': tcC.text,
                  'parentManagerId': null,
                  'criminalRecord': null,
                  'companyId': item?['companyId'] ?? 1,
                  if (passC.text.isNotEmpty) 'passwordHash': passC.text,
                };
                try {
                  if (item != null && item['id'] != null) {
                    await _api.updateUser(item['id'], body);
                    kSuccess(context, 'Güncellendi');
                  } else {
                    await _api.createUser(body);
                    kSuccess(context, 'Kullanıcı eklendi');
                  }
                  _load();
                } catch (e) {
                  kError(context, 'İşlem başarısız: $e');
                }
              },
              child: Text(
                item == null ? 'Kaydet' : 'Güncelle',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
    Future.delayed(const Duration(milliseconds: 300), () {
      for (final c in [firstC, lastC, emailC, passC, phoneC, tcC]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final name = '${item['firstName']} ${item['lastName']}'.trim();
    final ok = await kConfirm(
      context,
      'Kullanıcı Sil',
      '"$name" kullanıcısını silmek istiyor musunuz?',
    );
    if (ok == true) {
      try {
        await _api.deleteUser(item['id']);
        kSuccess(context, 'Silindi');
        _load();
      } catch (e) {
        kError(context, 'Silinemedi: $e');
      }
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
                child: TextField(
                  controller: _search,
                  style: const TextStyle(color: Colors.white),
                  decoration: fieldDecor('Kullanıcı ara...').copyWith(
                    prefixIcon: const Icon(
                      Icons.search,
                      color: kMuted,
                      size: 20,
                    ),
                  ),
                  onChanged: (_) => setState(_filter),
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
                            'Kayıt bulunamadı.',
                            style: TextStyle(color: kMuted),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) {
                            final u = _shown[i];
                            final name =
                                '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'
                                    .trim();
                            return Container(
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
                                          name.isEmpty ? '(isimsiz)' : name,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      kBadge(_roleLabel(u['role'] ?? u['roleId']), kBlue),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    u['email'] ?? '—',
                                    style: const TextStyle(
                                      color: Color(0xFF60A5FA),
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  kActions(
                                    () => _openForm(item: u),
                                    () => _delete(u),
                                  ),
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
          right: 16,
          bottom: 24,
          child: FloatingActionButton.extended(
            backgroundColor: kBlue,
            onPressed: () => _openForm(),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Kullanıcı Ekle',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
