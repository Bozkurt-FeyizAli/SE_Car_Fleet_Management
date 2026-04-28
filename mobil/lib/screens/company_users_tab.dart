import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

// Company Yöneticiler tab — mirrors web manager/tabs/UsersTab.tsx
// Shows roleId=2 users; full CRUD via /api/User
class CompanyUsersTab extends StatefulWidget {
  final int defaultCompanyId;
  const CompanyUsersTab({super.key, this.defaultCompanyId = 1});
  @override
  State<CompanyUsersTab> createState() => _CompanyUsersTabState();
}

class _CompanyUsersTabState extends State<CompanyUsersTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _data = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final users = await _api.getUsers();
      if (!mounted) return;
      setState(() {
        _data = users
            .cast<Map<String, dynamic>>()
            .where((u) => (u['roleId'] as num?)?.toInt() == 1 || (u['role'] as num?)?.toInt() == 1)
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _data;
    final q = _search.toLowerCase();
    return _data.where((u) {
      final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      return name.contains(q) || email.contains(q);
    }).toList();
  }

  void _openForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    final firstName = TextEditingController(text: item?['firstName'] ?? '');
    final lastName = TextEditingController(text: item?['lastName'] ?? '');
    final email = TextEditingController(text: item?['email'] ?? '');
    final phone = TextEditingController(text: item?['phone'] ?? '');
    final password = TextEditingController();
    final tcC = TextEditingController(text: item?['tcIdentityNumber'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: kCard,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(builder: (ctx, setSt) {
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(isEdit ? 'Yönetici Düzenle' : 'Yeni Yönetici',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            kField('Ad *', firstName),
            kField('Soyad', lastName),
            kField('E-posta *', email, type: TextInputType.emailAddress),
            kField('Şifre', password, obscure: !isEdit),
            kField('Telefon', phone, type: TextInputType.phone),
            kField('T.C. Kimlik No *', tcC, type: TextInputType.number),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: kBlue),
                onPressed: () async {
                  if (firstName.text.isEmpty || email.text.isEmpty || tcC.text.isEmpty) {
                    kError(ctx, 'Ad, E-posta ve TC zorunludur');
                    return;
                  }
                  final payload = {
                    'role': 1, // Company manager
                    'firstName': firstName.text,
                    'lastName': lastName.text,
                    'email': email.text,
                    if (password.text.isNotEmpty) 'passwordHash': password.text,
                    'phoneNumber': phone.text,
                    'tcIdentityNumber': tcC.text,
                    'parentManagerId': null,
                    'criminalRecord': null,
                    'companyId': widget.defaultCompanyId,
                  };
                  try {
                    if (isEdit && item['id'] != null) {
                      await _api.updateUser(item['id'], payload);
                    } else {
                      await _api.createUser(payload);
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                    kSuccess(context, isEdit ? 'Yönetici güncellendi' : 'Yönetici eklendi');
                    _load();
                  } catch (_) {
                    if (ctx.mounted) kError(ctx, 'Kayıt sırasında hata oluştu');
                  }
                },
                child: Text(isEdit ? 'Güncelle' : 'Ekle',
                    style: const TextStyle(color: Colors.white)),
              )),
            ]),
          ])),
        );
      }),
    );
  }

  void _confirmDelete(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Yönetici Sil', style: TextStyle(color: Colors.white)),
        content: Text(
            '"${item['firstName']} ${item['lastName']}" kullanıcısını silmek istiyor musunuz?',
            style: const TextStyle(color: kMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(context);
              try {
                await _api.deleteUser(item['id']);
                kSuccess(context, 'Yönetici silindi');
                _load();
              } catch (_) {
                kError(context, 'Silme işlemi başarısız');
              }
            },
            child: const Text('Sil', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
        child: Row(children: [
          Expanded(child: TextField(
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: kInputDec('Yönetici ara...'),
            onChanged: (v) => setState(() => _search = v),
          )),
          const SizedBox(width: 10),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => _openForm(),
            icon: const Icon(Icons.add_rounded, size: 18, color: Colors.white),
            label: const Text('Yönetici Ekle', style: TextStyle(color: Colors.white, fontSize: 12)),
          ),
        ]),
      ),
      if (_loading)
        const Expanded(child: Center(child: CircularProgressIndicator(color: kBlue)))
      else if (_filtered.isEmpty)
        const Expanded(child: Center(child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted))))
      else
        Expanded(child: RefreshIndicator(
          onRefresh: _load,
          color: kBlue,
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            itemCount: _filtered.length,
            itemBuilder: (_, i) {
              final u = _filtered[i];
              final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
              final email = u['email'] ?? '—';
              final status = u['driverTripStatus'] ?? 'active';
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: kCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: kBorder)),
                child: Row(children: [
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                        color: kBlue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(19)),
                    alignment: Alignment.center,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'Y',
                      style: const TextStyle(color: kBlue, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name.isEmpty ? '—' : name,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                    Text(email, style: const TextStyle(color: kBlue, fontSize: 11)),
                  ])),
                  kBadge(
                    status == 'active' ? 'Aktif' : 'Pasif',
                    status == 'active' ? kGreen : kMuted,
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => _openForm(item: u),
                    icon: const Icon(Icons.edit_rounded, size: 18, color: kMuted),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                  ),
                  IconButton(
                    onPressed: () => _confirmDelete(u),
                    icon: const Icon(Icons.delete_rounded, size: 18, color: Colors.red),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                  ),
                ]),
              );
            },
          ),
        )),
    ]);
  }
}
