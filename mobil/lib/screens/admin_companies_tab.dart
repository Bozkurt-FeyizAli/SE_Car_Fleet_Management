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
      final list = await _api.getCompanies();
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
                (c) => '${c['companyName'] ?? c['name'] ?? ''} ${c['taxNumber']}'
                    .toLowerCase()
                    .contains(q),
              )
              .toList();
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final isEdit = item != null;
    final nameC = TextEditingController(text: item?['companyName'] ?? item?['name'] ?? '');
    final taxC = TextEditingController(text: item?['taxNumber'] ?? '');

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => AlertDialog(
          backgroundColor: kCard,
          title: Text(
            isEdit ? 'Şirket Düzenle' : 'Yeni Şirket Ekle',
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  kField('Şirket Adı *', nameC),
                  kField('Vergi Numarası *', taxC),
                  if (isEdit) ...[
                    const SizedBox(height: 12),
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
                        label: const Text('Şirketi Sil', style: TextStyle(color: Colors.redAccent)),
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
                if (nameC.text.isEmpty || taxC.text.isEmpty) {
                  kError(context, 'Zorunlu alanları doldurun');
                  return;
                }
                Navigator.pop(ctx);
                final body = {
                  'companyName': nameC.text,
                  'taxNumber': taxC.text,
                };
                try {
                  if (isEdit) {
                    await _api.updateCompany(item['id'], body);
                    kSuccess(context, 'Şirket güncellendi');
                  } else {
                    final res = await _api.createCompany(body);
                    // Auto-create default "Genel" department
                    try {
                      int? newId;
                      if (res is Map) newId = (res['id'] as num?)?.toInt();
                      // If response doesn't have id, reload and find by tax number
                      if (newId == null) {
                        final all = await _api.getCompanies();
                        final match = all.cast<Map<String, dynamic>>().where(
                          (c) => c['taxNumber'] == taxC.text,
                        );
                        if (match.isNotEmpty) {
                          newId = (match.last['id'] as num?)?.toInt();
                        }
                      }
                      if (newId != null) {
                        await _api.createDepartment({
                          'departmentName': 'Genel',
                          'companyId': newId,
                        });
                      }
                    } catch (_) {}
                    kSuccess(context, 'Şirket eklendi');
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
      for (final c in [nameC, taxC]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final name = item['companyName'] ?? item['name'] ?? '—';
    final ok = await kConfirm(
      context,
      'Şirket Sil',
      '"$name" şirketini silmek istiyor musunuz?',
    );
    if (ok == true) {
      try {
        await _api.deleteCompany(item['id']);
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
                  decoration: fieldDecor('Şirket ara...').copyWith(
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
                            final c = _shown[i];
                            final name = c['companyName'] ?? c['name'] ?? '—';
                            final tax = c['taxNumber'] ?? '—';
                            return InkWell(
                              onTap: () => _openForm(item: c),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
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
                                        color: kBlue.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        name.isNotEmpty ? name[0].toUpperCase() : 'Ş',
                                        style: const TextStyle(color: kBlue, fontWeight: FontWeight.w700, fontSize: 15),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                            ),
                                          ),
                                          Text(
                                            'VKN: $tax',
                                            style: const TextStyle(color: kMuted, fontSize: 11),
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
            label: const Text('Şirket Ekle', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }
}
