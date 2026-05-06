import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

/// Company Departments Management Tab
/// Lists, creates, edits and deletes departments for a specific company.
class CompanyDepartmentsTab extends StatefulWidget {
  final int? companyId;
  const CompanyDepartmentsTab({super.key, this.companyId});
  @override
  State<CompanyDepartmentsTab> createState() => _State();
}

class _State extends State<CompanyDepartmentsTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _departments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final cId = widget.companyId;
      List<dynamic> list;
      if (cId != null) {
        list = await _api.getDepartmentsByCompany(cId);
      } else {
        list = await _api.getDepartments();
      }
      if (!mounted) return;
      setState(() {
        _departments = List<Map<String, dynamic>>.from(list);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Departmanlar yüklenemedi: $e');
    }
  }

  Future<void> _openForm({Map<String, dynamic>? item}) async {
    final isEdit = item != null;
    final nameC = TextEditingController(text: item?['departmentName'] ?? '');

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: Text(
          isEdit ? 'Departman Düzenle' : 'Yeni Departman',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              kField('Departman Adı *', nameC),
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
                    label: const Text('Departmanı Sil', style: TextStyle(color: Colors.redAccent)),
                  ),
                ),
              ],
            ],
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
              if (nameC.text.trim().isEmpty) {
                kError(context, 'Departman adı zorunludur');
                return;
              }
              Navigator.pop(ctx);
              try {
                final body = {
                  'departmentName': nameC.text.trim(),
                  'companyId': widget.companyId ?? 1,
                };
                if (isEdit) {
                  final id = (item['id'] as num?)?.toInt();
                  if (id != null) {
                    await _api.updateDepartment(id, body);
                    kSuccess(context, 'Departman güncellendi');
                  }
                } else {
                  await _api.createDepartment(body);
                  kSuccess(context, 'Departman eklendi');
                }
                _load();
              } catch (e) {
                kError(context, 'İşlem başarısız: $e');
              }
            },
            child: Text(
              isEdit ? 'Güncelle' : 'Ekle',
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
    Future.delayed(const Duration(milliseconds: 300), () => nameC.dispose());
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final name = item['departmentName'] ?? '—';
    final ok = await kConfirm(
      context,
      'Departman Sil',
      '"$name" departmanını silmek istiyor musunuz?\nBu departmana bağlı yöneticiler etkilenebilir.',
    );
    if (ok == true) {
      try {
        final id = (item['id'] as num?)?.toInt();
        if (id != null) await _api.deleteDepartment(id);
        kSuccess(context, 'Departman silindi');
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
              if (_loading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator(color: kBlue)),
                )
              else if (_departments.isEmpty)
                const Expanded(
                  child: Center(
                    child: Text('Henüz departman yok.', style: TextStyle(color: kMuted)),
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 90),
                    itemCount: _departments.length,
                    itemBuilder: (_, i) {
                      final d = _departments[i];
                      final name = d['departmentName'] ?? '—';
                      return InkWell(
                        onTap: () => _openForm(item: d),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
                                  color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                alignment: Alignment.center,
                                child: const Icon(Icons.folder_rounded, color: Color(0xFF7C3AED), size: 18),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
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
            label: const Text('Departman Ekle', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }
}
