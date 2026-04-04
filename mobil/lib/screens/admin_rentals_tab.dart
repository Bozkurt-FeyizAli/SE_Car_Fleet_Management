import 'package:flutter/material.dart';
import 'shared_styles.dart';

class _Rental {
  int id;
  String owner, renter, plate, driver, status, startDate, endDate;
  double price;
  _Rental({required this.id, required this.owner, required this.renter,
      required this.plate, required this.driver, required this.status,
      required this.price, required this.startDate, required this.endDate});
}

int _nextId = 1;

class AdminRentalsTab extends StatefulWidget {
  const AdminRentalsTab({super.key});
  @override
  State<AdminRentalsTab> createState() => _State();
}

class _State extends State<AdminRentalsTab> {
  final List<_Rental> _list = [];

  Future<void> _openForm({_Rental? item}) async {
    final ownerC  = TextEditingController(text: item?.owner ?? '');
    final renterC = TextEditingController(text: item?.renter ?? '');
    final plateC  = TextEditingController(text: item?.plate ?? '');
    final driverC = TextEditingController(text: item?.driver ?? '');
    final priceC  = TextEditingController(text: (item?.price ?? 3000).toString());
    final startC  = TextEditingController(text: item?.startDate ?? '');
    final endC    = TextEditingController(text: item?.endDate ?? '');
    String status = item?.status ?? 'active';

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, ss) => AlertDialog(
        backgroundColor: kCard,
        title: Text(item == null ? 'Yeni Kiralama Ekle' : 'Kiralama Düzenle',
            style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: SizedBox(width: double.maxFinite, child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Kiraya Veren Şirket *', ownerC),
            kField('Kiralayan Şirket *',    renterC),
            kField('Araç Plakası *',         plateC),
            kField('Şoför Adı',             driverC),
            kField('Fiyat (₺)',             priceC, type: TextInputType.number),
            kField('Başlangıç (YYYY-MM-DD)', startC),
            kField('Bitiş (YYYY-MM-DD)',    endC),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              value: status, dropdownColor: kCard,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: fieldDecor('Durum'),
              items: const [
                DropdownMenuItem(value: 'active',    child: Text('Aktif')),
                DropdownMenuItem(value: 'completed', child: Text('Tamamlandı')),
                DropdownMenuItem(value: 'cancelled', child: Text('İptal')),
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
            onPressed: () {
              if (ownerC.text.isEmpty || renterC.text.isEmpty || plateC.text.isEmpty) {
                kError(context, 'Zorunlu alanları doldurun'); return;
              }
              Navigator.pop(ctx);
              setState(() {
                if (item != null) {
                  item.owner = ownerC.text; item.renter = renterC.text;
                  item.plate = plateC.text; item.driver = driverC.text;
                  item.price = double.tryParse(priceC.text) ?? item.price;
                  item.startDate = startC.text; item.endDate = endC.text;
                  item.status = status;
                  kSuccess(context, 'Kiralama güncellendi');
                } else {
                  _list.add(_Rental(
                    id: _nextId++, owner: ownerC.text, renter: renterC.text,
                    plate: plateC.text, driver: driverC.text,
                    price: double.tryParse(priceC.text) ?? 3000,
                    startDate: startC.text, endDate: endC.text, status: status,
                  ));
                  kSuccess(context, 'Kiralama eklendi');
                }
              });
            },
            child: Text(item == null ? 'Kaydet' : 'Güncelle',
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      )),
    );
    Future.delayed(const Duration(milliseconds: 300), () {
      for (final c in [ownerC, renterC, plateC, driverC, priceC, startC, endC]) {
        c.dispose();
      }
    });
  }

  Future<void> _delete(_Rental item) async {
    final ok = await kConfirm(context, 'Kiralama Sil', 'Bu kiralama kaydını silmek istiyor musunuz?');
    if (ok == true) setState(() { _list.remove(item); kSuccess(context, 'Silindi'); });
  }

  Color _sColor(String s) {
    switch (s) {
      case 'active':    return Colors.green;
      case 'completed': return Colors.blue;
      default:          return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Container(
        color: kBg,
        child: _list.isEmpty
            ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.swap_horiz_rounded, size: 48, color: kMuted),
                SizedBox(height: 12),
                Text('Kiralama kaydı yok.\n+ düğmesine basarak ekleyin.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kMuted, fontSize: 14)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 90),
                itemCount: _list.length,
                itemBuilder: (_, i) {
                  final r = _list[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: kCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: kBorder)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(r.plate,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15))),
                        kBadge(kStatusLabel(r.status), _sColor(r.status)),
                      ]),
                      const SizedBox(height: 4),
                      Text('${r.owner}  →  ${r.renter}',
                          style: const TextStyle(color: kMuted, fontSize: 12)),
                      Text('Şoför: ${r.driver.isEmpty ? '—' : r.driver}  ·  ₺${r.price.toStringAsFixed(0)}',
                          style: const TextStyle(color: kMuted, fontSize: 11)),
                      Text('${r.startDate.isEmpty ? '—' : r.startDate} – ${r.endDate.isEmpty ? '→' : r.endDate}',
                          style: const TextStyle(color: kMuted, fontSize: 11)),
                      const SizedBox(height: 8),
                      kActions(() => _openForm(item: r), () => _delete(r)),
                    ]),
                  );
                }),
      ),
      Positioned(
        right: 16, bottom: 24,
        child: FloatingActionButton.extended(
          backgroundColor: kBlue, onPressed: () => _openForm(),
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Kiralama Ekle', style: TextStyle(color: Colors.white)),
        ),
      ),
    ]);
  }
}
