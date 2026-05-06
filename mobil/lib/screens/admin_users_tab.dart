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
  Map<int, String> _companyNames = {};
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
      final results = await Future.wait([
        _api.getUsers(),
        _api.getCompanies().catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;
      final companies = (results[1] as List).cast<Map<String, dynamic>>();
      final cMap = <int, String>{};
      for (final c in companies) {
        final id = (c['id'] as num?)?.toInt();
        if (id != null) cMap[id] = c['companyName'] ?? c['name'] ?? '—';
      }
      setState(() {
        _all = results[0].cast();
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
      case 0: return 'Admin';
      case 1: return 'Yönetici';
      case 2: return 'Şoför';
      default: return 'Bilinmeyen';
    }
  }

  Color _roleColor(int? id) {
    switch (id) {
      case 0: return const Color(0xFFEA580C);
      case 1: return const Color(0xFF7C3AED);
      case 2: return kGreen;
      default: return kMuted;
    }
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final isEdit = item != null;
    final firstC = TextEditingController(text: item?['firstName'] ?? '');
    final lastC = TextEditingController(text: item?['lastName'] ?? '');
    final emailC = TextEditingController(text: item?['email'] ?? '');
    final passC = TextEditingController();
    final phoneC = TextEditingController(text: item?['phoneNumber'] ?? item?['phone'] ?? '');
    final tcC = TextEditingController(text: item?['tcIdentityNumber'] ?? '');
    int roleId = item?['role'] ?? item?['roleId'] ?? 2;
    int companyId = (item?['companyId'] as num?)?.toInt() ?? 1;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => AlertDialog(
          backgroundColor: kCard,
          title: Text(
            isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı',
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
                  if (!isEdit) kField('Şifre *', passC, obscure: true)
                  else kField('Yeni Şifre (boş bırakılabilir)', passC, obscure: true),
                  kField('Telefon', phoneC, type: TextInputType.phone),
                  kField('T.C. Kimlik No', tcC, type: TextInputType.number),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<int>(
                    value: roleId == 3 ? 2 : roleId,
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
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    value: _companyNames.containsKey(companyId) ? companyId : null,
                    dropdownColor: kCard,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: fieldDecor('Şirket'),
                    items: _companyNames.entries.map((e) =>
                      DropdownMenuItem(value: e.key, child: Text(e.value)),
                    ).toList(),
                    onChanged: (v) => ss(() => companyId = v ?? companyId),
                  ),
                  if (isEdit) ...[
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _delete(item);
                        },
                        icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.redAccent),
                        label: const Text('Kullanıcıyı Sil', style: TextStyle(color: Colors.redAccent)),
                      ),
                    ),
                  ],
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
                if (firstC.text.isEmpty || emailC.text.isEmpty) {
                  kError(context, 'Ad ve E-posta zorunludur');
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
                  'parentManagerId': item?['parentManagerId'],
                  'criminalRecord': item?['criminalRecord'],
                  'companyId': companyId,
                  if (passC.text.isNotEmpty) 'passwordHash': passC.text,
                };
                try {
                  if (isEdit) {
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
                isEdit ? 'Güncelle' : 'Kaydet',
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
                    prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
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
                          child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) {
                            final u = _shown[i];
                            final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                            final email = u['email'] ?? '—';
                            final roleId = (u['role'] as num?)?.toInt() ?? (u['roleId'] as num?)?.toInt();
                            final cId = (u['companyId'] as num?)?.toInt();
                            final companyName = cId != null ? (_companyNames[cId] ?? '—') : '—';

                            return InkWell(
                              onTap: () => _openForm(item: u),
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
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: _roleColor(roleId).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(18),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                                        style: TextStyle(
                                          color: _roleColor(roleId),
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            name.isEmpty ? '(isimsiz)' : name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 13,
                                            ),
                                          ),
                                          Text(
                                            email,
                                            style: const TextStyle(color: kBlue, fontSize: 11),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            companyName,
                                            style: const TextStyle(color: kMuted, fontSize: 10),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    kBadge(_roleLabel(roleId), _roleColor(roleId)),
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
            label: const Text('Kullanıcı Ekle', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }
}
