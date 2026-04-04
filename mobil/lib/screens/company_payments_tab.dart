import 'package:flutter/material.dart';
import 'shared_styles.dart';

// Company Ödemeler tab — mirrors web manager/tabs/PaymentsTab.tsx
class CompanyPaymentsTab extends StatefulWidget {
  const CompanyPaymentsTab({super.key});
  @override
  State<CompanyPaymentsTab> createState() => _CompanyPaymentsTabState();
}

class _CompanyPaymentsTabState extends State<CompanyPaymentsTab> {
  final List<Map<String, dynamic>> _payments = [
    {
      'id': 1, 'paymentType': 'incoming', 'amount': 15000,
      'paymentMethod': 'Havale', 'transactionId': 'TXN-001',
      'paymentDate': '2026-03-15', 'description': 'Müşteri ödemesi'
    },
    {
      'id': 2, 'paymentType': 'outgoing', 'amount': 4500,
      'paymentMethod': 'Kredi Kartı', 'transactionId': 'TXN-002',
      'paymentDate': '2026-03-16', 'description': 'Yakıt gideri'
    },
    {
      'id': 3, 'paymentType': 'incoming', 'amount': 8200,
      'paymentMethod': 'Nakit', 'transactionId': 'TXN-003',
      'paymentDate': '2026-03-17', 'description': 'Kargo ücreti'
    },
  ];
  String _search = '';

  int get _totalIncome => _payments
      .where((p) => p['paymentType'] == 'incoming')
      .fold(0, (s, p) => s + (p['amount'] as int));

  int get _totalExpense => _payments
      .where((p) => p['paymentType'] == 'outgoing')
      .fold(0, (s, p) => s + (p['amount'] as int));

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _payments;
    final q = _search.toLowerCase();
    return _payments.where((p) =>
        (p['description'] ?? '').toString().toLowerCase().contains(q) ||
        (p['transactionId'] ?? '').toString().toLowerCase().contains(q)).toList();
  }

  void _openForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    String payType = item?['paymentType'] ?? 'incoming';
    final amount = TextEditingController(text: (item?['amount'] ?? 0).toString());
    String method = item?['paymentMethod'] ?? 'Havale';
    final transId = TextEditingController(text: item?['transactionId'] ?? '');
    final date = TextEditingController(
        text: item?['paymentDate'] ?? DateTime.now().toIso8601String().substring(0, 10));
    final desc = TextEditingController(text: item?['description'] ?? '');

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
            Text(isEdit ? 'Ödeme Düzenle' : 'Yeni Ödeme',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            kLabel('Tip'),
            kDropdown(payType, ['incoming', 'outgoing'], ['Gelir', 'Gider'],
                (v) => setSt(() => payType = v!)),
            kField('Tutar (TL) *', amount, type: TextInputType.number),
            kLabel('Ödeme Yöntemi'),
            kDropdown(method, ['Havale', 'Kredi Kartı', 'Nakit'],
                ['Havale', 'Kredi Kartı', 'Nakit'],
                (v) => setSt(() => method = v!)),
            kField('İşlem No', transId),
            kField('Tarih', date, type: TextInputType.datetime),
            kField('Açıklama *', desc),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kBlue),
              onPressed: () {
                if (amount.text.isEmpty || desc.text.isEmpty) {
                  kError(ctx, 'Tutar ve Açıklama zorunludur');
                  return;
                }
                setState(() {
                  if (isEdit) {
                    final idx = _payments.indexWhere((p) => p['id'] == item['id']);
                    if (idx >= 0) {
                      _payments[idx] = {
                        ..._payments[idx],
                        'paymentType': payType,
                        'amount': int.tryParse(amount.text) ?? 0,
                        'paymentMethod': method,
                        'transactionId': transId.text,
                        'paymentDate': date.text,
                        'description': desc.text,
                      };
                    }
                  } else {
                    _payments.insert(0, {
                      'id': DateTime.now().millisecondsSinceEpoch,
                      'paymentType': payType,
                      'amount': int.tryParse(amount.text) ?? 0,
                      'paymentMethod': method,
                      'transactionId': transId.text,
                      'paymentDate': date.text,
                      'description': desc.text,
                    });
                  }
                });
                Navigator.pop(ctx);
                kSuccess(context, isEdit ? 'Ödeme güncellendi' : 'Ödeme eklendi');
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
        title: const Text('Ödeme Sil', style: TextStyle(color: Colors.white)),
        content: const Text('Bu ödeme kaydını silmek istiyor musunuz?',
            style: TextStyle(color: kMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              setState(() => _payments.removeWhere((p) => p['id'] == item['id']));
              Navigator.pop(context);
              kSuccess(context, 'Ödeme silindi');
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
      // Summary row
      Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
        child: Row(children: [
          Expanded(child: _summaryCard('Gelir', _totalIncome, kGreen)),
          const SizedBox(width: 8),
          Expanded(child: _summaryCard('Gider', _totalExpense, Colors.red)),
          const SizedBox(width: 8),
          Expanded(child: _summaryCard('Net', _totalIncome - _totalExpense,
              (_totalIncome - _totalExpense) >= 0 ? kGreen : Colors.red)),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 6),
        child: Row(children: [
          Expanded(child: TextField(
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: kInputDec('Ödeme ara...'),
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
        const Expanded(child: Center(child: Text('Ödeme bulunamadı.', style: TextStyle(color: kMuted))))
      else
        Expanded(child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          itemCount: _filtered.length,
          itemBuilder: (_, i) {
            final p = _filtered[i];
            final isIncoming = p['paymentType'] == 'incoming';
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
                      color: (isIncoming ? kGreen : Colors.red).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(18)),
                  child: Icon(
                    isIncoming ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                    color: isIncoming ? kGreen : Colors.red, size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p['description'] ?? '—',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text('${p['paymentDate']} · ${p['paymentMethod']}',
                      style: const TextStyle(color: kMuted, fontSize: 11)),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${isIncoming ? '+' : '-'}₺${(p['amount'] as int).toStringAsFixed(0)}',
                      style: TextStyle(
                          color: isIncoming ? kGreen : Colors.red,
                          fontSize: 14, fontWeight: FontWeight.w700)),
                  Row(children: [
                    IconButton(
                      onPressed: () => _openForm(item: p),
                      icon: const Icon(Icons.edit_rounded, size: 16, color: kMuted),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                    ),
                    IconButton(
                      onPressed: () => _confirmDelete(p),
                      icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.red),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                    ),
                  ]),
                ]),
              ]),
            );
          },
        )),
    ]);
  }

  Widget _summaryCard(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3))),
      child: Column(children: [
        Text('₺${value.abs().toStringAsFixed(0)}',
            style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w700)),
        Text(label, style: const TextStyle(color: kMuted, fontSize: 10)),
      ]),
    );
  }
}
