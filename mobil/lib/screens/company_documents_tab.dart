import 'package:flutter/material.dart';
import 'shared_styles.dart';

// Company Belgeler tab — mirrors web manager/tabs/DocumentsTab.tsx
class CompanyDocumentsTab extends StatefulWidget {
  const CompanyDocumentsTab({super.key});
  @override
  State<CompanyDocumentsTab> createState() => _CompanyDocumentsTabState();
}

class _CompanyDocumentsTabState extends State<CompanyDocumentsTab> {
  final List<Map<String, dynamic>> _docs = [
    {
      'id': 1, 'documentType': 'Vergi Levhası', 'filePath': '/docs/vergi_levhasi.pdf',
      'expiryDate': '2026-12-31', 'notes': 'Yıllık yenileme gerekli', 'isVerified': true
    },
    {
      'id': 2, 'documentType': 'Taşıma Yetki Belgesi', 'filePath': '/docs/tasima_yetki.pdf',
      'expiryDate': '2026-06-30', 'notes': '', 'isVerified': false
    },
  ];
  String _search = '';

  final _docTypes = [
    'Vergi Levhası', 'Ticaret Sicil Gazetesi',
    'Taşıma Yetki Belgesi', 'Sigorta Poliçesi', 'Diğer'
  ];

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _docs;
    final q = _search.toLowerCase();
    return _docs.where((d) =>
        (d['documentType'] ?? '').toString().toLowerCase().contains(q) ||
        (d['notes'] ?? '').toString().toLowerCase().contains(q)).toList();
  }

  void _openForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    String docType = (item != null && _docTypes.contains(item['documentType']))
        ? item['documentType'] as String
        : _docTypes[0];
    final filePath = TextEditingController(text: item?['filePath'] ?? '');
    final expiry = TextEditingController(text: item?['expiryDate'] ?? '');
    final notes = TextEditingController(text: item?['notes'] ?? '');

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
            Text(isEdit ? 'Belge Düzenle' : 'Yeni Belge',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            kLabel('Belge Tipi *'),
            kDropdown(docType, _docTypes, _docTypes,
                (v) => setSt(() => docType = v!)),
            kField('Dosya Yolu', filePath, hint: '/docs/belge.pdf'),
            kField('Geçerlilik Bitiş (YYYY-MM-DD)', expiry),
            kField('Not', notes),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kBlue),
              onPressed: () {
                setState(() {
                  if (isEdit) {
                    final idx = _docs.indexWhere((d) => d['id'] == item['id']);
                    if (idx >= 0) {
                      _docs[idx] = {
                        ..._docs[idx],
                        'documentType': docType,
                        'filePath': filePath.text,
                        'expiryDate': expiry.text,
                        'notes': notes.text,
                      };
                    }
                  } else {
                    _docs.insert(0, {
                      'id': DateTime.now().millisecondsSinceEpoch,
                      'documentType': docType,
                      'filePath': filePath.text,
                      'expiryDate': expiry.text,
                      'notes': notes.text,
                      'isVerified': false,
                    });
                  }
                });
                Navigator.pop(ctx);
                kSuccess(context, isEdit ? 'Belge güncellendi' : 'Belge eklendi');
              },
              child: Text(isEdit ? 'Güncelle' : 'Ekle',
                  style: const TextStyle(color: Colors.white)),
            )),
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
        title: const Text('Belge Sil', style: TextStyle(color: Colors.white)),
        content: const Text('Bu belgeyi silmek istiyor musunuz?',
            style: TextStyle(color: kMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              setState(() => _docs.removeWhere((d) => d['id'] == item['id']));
              Navigator.pop(context);
              kSuccess(context, 'Belge silindi');
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
            decoration: kInputDec('Belge ara...'),
            onChanged: (v) => setState(() => _search = v),
          )),
          const SizedBox(width: 10),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => _openForm(),
            icon: const Icon(Icons.add_rounded, size: 18, color: Colors.white),
            label: const Text('Ekle', style: TextStyle(color: Colors.white, fontSize: 12)),
          ),
        ]),
      ),
      if (_filtered.isEmpty)
        const Expanded(child: Center(child: Text('Belge bulunamadı.', style: TextStyle(color: kMuted))))
      else
        Expanded(child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          itemCount: _filtered.length,
          itemBuilder: (_, i) {
            final d = _filtered[i];
            final verified = d['isVerified'] == true;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: kCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder)),
              child: Row(children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                      color: kBlue.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.description_rounded, color: kBlue, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(d['documentType'] ?? '—',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                  if ((d['expiryDate'] ?? '').toString().isNotEmpty)
                    Text('Geçerlilik: ${d['expiryDate']}',
                        style: const TextStyle(color: kMuted, fontSize: 11)),
                  if ((d['notes'] ?? '').toString().isNotEmpty)
                    Text(d['notes'].toString(), style: const TextStyle(color: kMuted, fontSize: 11),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                ])),
                kBadge(verified ? 'Onaylı' : 'Beklemede',
                    verified ? kGreen : Colors.orange),
                const SizedBox(width: 6),
                IconButton(
                  onPressed: () => _openForm(item: d),
                  icon: const Icon(Icons.edit_rounded, size: 16, color: kMuted),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                ),
                IconButton(
                  onPressed: () => _confirmDelete(d),
                  icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.red),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                ),
              ]),
            );
          },
        )),
    ]);
  }
}
