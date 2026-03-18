import 'package:flutter/material.dart';
import 'shared_styles.dart';

// Company Siparişler tab — mirrors web manager/tabs/OrdersTab.tsx
// Uses in-memory local state (web also uses mockData for orders)
class CompanyOrdersTab extends StatefulWidget {
  const CompanyOrdersTab({super.key});
  @override
  State<CompanyOrdersTab> createState() => _CompanyOrdersTabState();
}

class _CompanyOrdersTabState extends State<CompanyOrdersTab> {
  final List<Map<String, dynamic>> _orders = [
    {
      'id': 1, 'orderNumber': 'ORD-001', 'customerName': 'Ahmet Yılmaz',
      'pickupAddress': 'İstanbul, Kadıköy', 'deliveryAddress': 'Ankara, Çankaya',
      'price': 4500, 'status': 'pending', 'paymentStatus': 'unpaid',
      'scheduledTime': '2026-03-20 09:00', 'notes': ''
    },
    {
      'id': 2, 'orderNumber': 'ORD-002', 'customerName': 'Fatma Demir',
      'pickupAddress': 'İzmir, Bornova', 'deliveryAddress': 'İstanbul, Şişli',
      'price': 3200, 'status': 'picked_up', 'paymentStatus': 'paid',
      'scheduledTime': '2026-03-19 14:00', 'notes': 'Kırılgan eşya'
    },
  ];
  String _search = '';

  String _statusLabel(String s) {
    switch (s) {
      case 'pending': return 'Beklemede';
      case 'assigned': return 'Atandı';
      case 'picked_up': return 'Alındı';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return s;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'pending': return Colors.orange;
      case 'picked_up': return kBlue;
      case 'delivered': return kGreen;
      case 'cancelled': return Colors.red;
      default: return kMuted;
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _orders;
    final q = _search.toLowerCase();
    return _orders.where((o) =>
        (o['orderNumber'] ?? '').toString().toLowerCase().contains(q) ||
        (o['customerName'] ?? '').toString().toLowerCase().contains(q)).toList();
  }

  void _openForm({Map<String, dynamic>? item}) {
    final isEdit = item != null;
    final customerName = TextEditingController(text: item?['customerName'] ?? '');
    final orderNumber = TextEditingController(
        text: item?['orderNumber'] ?? 'ORD-${DateTime.now().millisecondsSinceEpoch % 10000}');
    final pickup = TextEditingController(text: item?['pickupAddress'] ?? '');
    final delivery = TextEditingController(text: item?['deliveryAddress'] ?? '');
    final price = TextEditingController(text: (item?['price'] ?? 0).toString());
    final notes = TextEditingController(text: item?['notes'] ?? '');
    String status = item?['status'] ?? 'pending';
    String payStatus = item?['paymentStatus'] ?? 'unpaid';

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
            Text(isEdit ? 'Sipariş Düzenle' : 'Yeni Sipariş',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            kField('Müşteri Adı *', customerName),
            kField('Sipariş No', orderNumber),
            kField('Alım Adresi *', pickup),
            kField('Teslimat Adresi *', delivery),
            kField('Ücret (TL)', price, type: TextInputType.number),
            kField('Notlar', notes),
            kLabel('Durum'),
            kDropdown(status,
                ['pending', 'assigned', 'picked_up', 'delivered', 'cancelled'],
                ['Beklemede', 'Atandı', 'Alındı', 'Teslim Edildi', 'İptal'],
                (v) => setSt(() => status = v!)),
            kLabel('Ödeme Durumu'),
            kDropdown(payStatus,
                ['unpaid', 'paid', 'refunded'],
                ['Ödenmedi', 'Ödendi', 'İade'],
                (v) => setSt(() => payStatus = v!)),
            const SizedBox(height: 14),
            SizedBox(width: double.infinity, child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: kBlue),
              onPressed: () {
                if (customerName.text.isEmpty || pickup.text.isEmpty || delivery.text.isEmpty) {
                  kError(ctx, 'Zorunlu alanları doldurun');
                  return;
                }
                setState(() {
                  if (isEdit) {
                    final idx = _orders.indexWhere((o) => o['id'] == item['id']);
                    if (idx >= 0) {
                      _orders[idx] = {
                        ..._orders[idx],
                        'customerName': customerName.text,
                        'orderNumber': orderNumber.text,
                        'pickupAddress': pickup.text,
                        'deliveryAddress': delivery.text,
                        'price': int.tryParse(price.text) ?? 0,
                        'status': status,
                        'paymentStatus': payStatus,
                        'notes': notes.text,
                      };
                    }
                  } else {
                    _orders.insert(0, {
                      'id': DateTime.now().millisecondsSinceEpoch,
                      'orderNumber': orderNumber.text,
                      'customerName': customerName.text,
                      'pickupAddress': pickup.text,
                      'deliveryAddress': delivery.text,
                      'price': int.tryParse(price.text) ?? 0,
                      'status': status,
                      'paymentStatus': payStatus,
                      'scheduledTime': '',
                      'notes': notes.text,
                    });
                  }
                });
                Navigator.pop(ctx);
                kSuccess(context, isEdit ? 'Sipariş güncellendi' : 'Sipariş eklendi');
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
        title: const Text('Sipariş Sil', style: TextStyle(color: Colors.white)),
        content: Text('"${item['orderNumber']}" siparişini silmek istiyor musunuz?',
            style: const TextStyle(color: kMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
              child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              setState(() => _orders.removeWhere((o) => o['id'] == item['id']));
              Navigator.pop(context);
              kSuccess(context, 'Sipariş silindi');
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
            decoration: kInputDec('Sipariş ara...'),
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
        const Expanded(child: Center(child: Text('Sipariş bulunamadı.', style: TextStyle(color: kMuted))))
      else
        Expanded(child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          itemCount: _filtered.length,
          itemBuilder: (_, i) {
            final o = _filtered[i];
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: kCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: kBorder)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(o['orderNumber'] ?? '—',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600))),
                  kBadge(_statusLabel(o['status']), _statusColor(o['status'])),
                ]),
                const SizedBox(height: 4),
                Text(o['customerName'] ?? '—', style: const TextStyle(color: kMuted, fontSize: 12)),
                const SizedBox(height: 4),
                Text('${o['pickupAddress']} → ${o['deliveryAddress']}',
                    style: const TextStyle(color: kMuted, fontSize: 11),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Row(children: [
                  Text('₺${(o['price'] as int).toStringAsFixed(0)}',
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  kBadge(
                    o['paymentStatus'] == 'paid' ? 'Ödendi' : o['paymentStatus'] == 'refunded' ? 'İade' : 'Ödenmedi',
                    o['paymentStatus'] == 'paid' ? kGreen : o['paymentStatus'] == 'refunded' ? kBlue : Colors.orange,
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    onPressed: () => _openForm(item: o),
                    icon: const Icon(Icons.edit_rounded, size: 16, color: kMuted),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  ),
                  IconButton(
                    onPressed: () => _confirmDelete(o),
                    icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.red),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  ),
                ]),
              ]),
            );
          },
        )),
    ]);
  }
}
