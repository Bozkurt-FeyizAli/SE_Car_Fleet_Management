import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminRentalsTab extends StatefulWidget {
  final UserModel user;
  const AdminRentalsTab({super.key, required this.user});
  @override
  State<AdminRentalsTab> createState() => _State();
}

class _State extends State<AdminRentalsTab> with SingleTickerProviderStateMixin {
  final _api = ApiService();
  late TabController _tab;

  // Raw data
  List<Map<String, dynamic>> _allVehicles = [];
  List<Map<String, dynamic>> _allRentals = [];
  List<Map<String, dynamic>> _registrations = [];
  Map<int, String> _companyNames = {};
  bool _loading = true;

  // Search controllers
  final _searchMarket = TextEditingController();
  final _searchRentIns = TextEditingController();
  final _searchStore = TextEditingController();

  int get _myCompanyId => widget.user.companyId ?? 1;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tab.dispose();
    _searchMarket.dispose();
    _searchRentIns.dispose();
    _searchStore.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getVehicles(),
        _api.getAllRentals(),
        _api.getVehicleRegistrations(),
        _api.getCompanies().catchError((_) => <dynamic>[]),
      ]);
      if (!mounted) return;
      
      final companies = (results[3] as List).cast<Map<String, dynamic>>();
      final cMap = <int, String>{};
      for (final c in companies) {
        final id = (c['id'] as num?)?.toInt();
        if (id != null) cMap[id] = c['companyName'] ?? c['name'] ?? '—';
      }
      
      setState(() {
        _allVehicles = List<Map<String, dynamic>>.from(results[0]);
        _allRentals = List<Map<String, dynamic>>.from(results[1]);
        _registrations = List<Map<String, dynamic>>.from(results[2]);
        _companyNames = cMap;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Veriler yüklenemedi: $e');
    }
  }

  // ── Derived lists ──────────────────────────────────────────────────────────

  /// Vehicles from other companies listed for hire (baseRentPrice > 0, isActive = true)
  List<Map<String, dynamic>> get _hireable => _allVehicles.where((v) {
    final price = (v['baseRentPrice'] as num?) ?? 0;
    return v['companyId'] != _myCompanyId && price > 0 && v['isActive'] == true;
  }).toList();

  /// My active rent-ins (I am the renter, not completed)
  List<Map<String, dynamic>> get _myActiveRentals => _allRentals.where((r) {
    return r['renterCompanyId'] == _myCompanyId && r['isCompleted'] == false;
  }).toList();

  /// My vehicles currently listed for hire
  List<Map<String, dynamic>> get _myListedVehicles => _allVehicles.where((v) {
    final price = (v['baseRentPrice'] as num?) ?? 0;
    return v['companyId'] == _myCompanyId && price > 0;
  }).toList();

  /// My vehicles NOT listed for hire (available to put up)
  List<Map<String, dynamic>> get _myUnlistedVehicles => _allVehicles.where((v) {
    final price = (v['baseRentPrice'] as num?) ?? 0;
    return v['companyId'] == _myCompanyId && price == 0;
  }).toList();

  // ── Brand/model lookup ─────────────────────────────────────────────────────
  String _brandModel(Map<String, dynamic> v) {
    final regNum = v['registrationNumber'];
    final reg = _registrations.firstWhere(
      (r) => r['registrationNumber'] == regNum,
      orElse: () => <String, dynamic>{},
    );
    return reg['brandModel'] ?? reg['type'] ?? '—';
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  Widget _sectionCard({required Widget child}) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: kCard,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder),
    ),
    child: child,
  );

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(children: [
      Text('$label: ', style: const TextStyle(color: kMuted, fontSize: 12)),
      Expanded(child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 12))),
    ]),
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  TAB 1 — Hire Market (Rent In)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildHireMarket() {
    final q = _searchMarket.text.toLowerCase();
    final filtered = _hireable.where((v) {
      if (q.isEmpty) return true;
      final plate = (v['plate'] ?? v['plateNumber'] ?? '').toString().toLowerCase();
      final model = _brandModel(v).toLowerCase();
      return plate.contains(q) || model.contains(q);
    }).toList();

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
        child: TextField(
          controller: _searchMarket,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: fieldDecor('Araç ara (plaka, model...)').copyWith(
            prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
          ),
          onChanged: (_) => setState(() {}),
        ),
      ),
      Expanded(
        child: filtered.isEmpty
            ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.store_outlined, size: 48, color: kMuted),
                SizedBox(height: 12),
                Text('Kiralık araç bulunamadı.', style: TextStyle(color: kMuted, fontSize: 14)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final v = filtered[i];
                  final plate = v['plate'] ?? v['plateNumber'] ?? '—';
                  final price = (v['baseRentPrice'] as num?)?.toStringAsFixed(0) ?? '0';
                  final model = _brandModel(v);
                  return _sectionCard(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.directions_car, color: kBlue, size: 20),
                        const SizedBox(width: 8),
                        Expanded(child: Text(plate, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15))),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: kBlue.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                          child: Text('₺$price/gün', style: const TextStyle(color: kBlue, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ]),
                      const SizedBox(height: 6),
                      if (model != '—') _infoRow('Model', model),
                      _infoRow('Şirket', _companyNames[(v['companyId'] as num?)?.toInt()] ?? 'Şirket #${v['companyId']}'),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          icon: const Icon(Icons.handshake_outlined, size: 16, color: Colors.white),
                          label: const Text('Kirala', style: TextStyle(color: Colors.white)),
                          style: ElevatedButton.styleFrom(backgroundColor: kBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                          onPressed: () => _showRentDialog(v),
                        ),
                      ),
                    ],
                  ));
                },
              ),
      ),
    ]);
  }

  Future<void> _showRentDialog(Map<String, dynamic> v) async {
    final plate = v['plate'] ?? v['plateNumber'] ?? '';
    final startC = TextEditingController(text: DateTime.now().toIso8601String().split('T').first);
    final endC = TextEditingController();
    final kmC = TextEditingController(text: (v['currentKm'] ?? 0).toString());

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: Text('Kirala — $plate', style: const TextStyle(color: Colors.white, fontSize: 15)),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Başlangıç (YYYY-MM-DD)', startC),
            kField('Bitiş (YYYY-MM-DD)', endC),
            kField('Başlangıç KM', kmC, type: TextInputType.number),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Onayla', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;
    final endText = endC.text;
    if (endText.isEmpty) { if (mounted) kError(context, 'Bitiş tarihi gerekli'); return; }
    final startText = startC.text;
    final kmText = kmC.text;

    setState(() => _loading = true);
    try {
      await _api.createRentalRequest({
        'vehiclePlate': plate,
        'renterCompanyId': _myCompanyId,
        'rentedCompanyId': v['companyId'],
        'startDate': '${startText}T00:00:00.000Z',
        'endDate': '${endText}T00:00:00.000Z',
        'rentStartKm': double.tryParse(kmText) ?? 0,
      });
      // Mark vehicle as inactive (rented out)
      await _api.patchVehicleActive(plate, false);
      if (mounted) kSuccess(context, 'Araç başarıyla kiralandı!');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      if (mounted) kError(context, 'İşlem başarısız: $e');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TAB 2 — My Active Rentals (Return)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildMyRentals() {
    final q = _searchRentIns.text.toLowerCase();
    final filtered = _myActiveRentals.where((r) {
      if (q.isEmpty) return true;
      final plate = (r['vehiclePlate'] ?? '').toString().toLowerCase();
      final owner = (r['ownerCompanyName'] ?? '').toString().toLowerCase();
      return plate.contains(q) || owner.contains(q);
    }).toList();

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
        child: TextField(
          controller: _searchRentIns,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: fieldDecor('Araç ara (plaka, sahip...)').copyWith(
            prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
          ),
          onChanged: (_) => setState(() {}),
        ),
      ),
      Expanded(
        child: filtered.isEmpty
            ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.receipt_long_outlined, size: 48, color: kMuted),
                SizedBox(height: 12),
                Text('Aktif kiralama yok.', style: TextStyle(color: kMuted, fontSize: 14)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final r = filtered[i];
                  final plate = r['vehiclePlate'] ?? '—';
                  final sDate = (r['startDate']?.toString() ?? '').split('T').first;
                  final eDate = (r['endDate']?.toString() ?? '').split('T').first;
                  final status = r['status']?.toString() ?? 'Pending';
                  final isApproved = status == 'Approved';
                  final isRejected = status == 'Rejected';

                  return _sectionCard(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.directions_car, color: Colors.orangeAccent, size: 20),
                        const SizedBox(width: 8),
                        Expanded(child: Text(plate, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15))),
                        kBadge(
                          isApproved ? 'Aktif' : (isRejected ? 'Reddedildi' : 'Onay Bekliyor'),
                          isApproved ? Colors.orangeAccent : (isRejected ? Colors.redAccent : kMuted)
                        ),
                      ]),
                      const SizedBox(height: 6),
                      _infoRow('Sahibi', r['ownerCompanyName'] ?? 'Şirket #${r['ownerCompanyId'] ?? r['rentedCompanyId']}'),
                      _infoRow('Süre', '$sDate – $eDate'),
                      const SizedBox(height: 10),
                      if (isApproved)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.assignment_return_outlined, size: 16, color: Colors.white),
                            label: const Text('İade Et', style: TextStyle(color: Colors.white)),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                            onPressed: () => _showReturnDialog(r),
                          ),
                        )
                      else if (!isRejected)
                        const Center(child: Text('Sahibinin onayı bekleniyor', style: TextStyle(color: Colors.orangeAccent, fontSize: 12))),
                    ],
                  ));
                },
              ),
      ),
    ]);
  }

  Future<void> _showReturnDialog(Map<String, dynamic> r) async {
    final plate = r['vehiclePlate'] ?? '';
    final retKmC = TextEditingController();
    final priceC = TextEditingController();
    final retDateC = TextEditingController(text: DateTime.now().toIso8601String().split('T').first);

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: Text('İade — $plate', style: const TextStyle(color: Colors.white, fontSize: 15)),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Dönüş Tarihi (YYYY-MM-DD)', retDateC),
            kField('Dönüş KM', retKmC, type: TextInputType.number),
            kField('Toplam Ücret (₺)', priceC, type: TextInputType.number),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kGreen),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Onayla', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;
    final retDate = retDateC.text;
    final retKm = retKmC.text;
    final price = priceC.text;

    setState(() => _loading = true);
    try {
      await _api.returnRental(r['id'], {
        'returnDate': '${retDate}T00:00:00.000Z',
        'returnKm': double.tryParse(retKm) ?? 0,
        'totalPrice': double.tryParse(price) ?? 0,
      });
      // Restore vehicle to active so it re-appears in the market
      await _api.patchVehicleActive(plate, true);
      if (mounted) kSuccess(context, 'Araç iade edildi!');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'İade başarısız: $e');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TAB 3 — Rent-Out Store (my vehicles)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildMyStore() {
    final q = _searchStore.text.toLowerCase();
    // All my listed vehicles (baseRentPrice > 0)
    final listed = _myListedVehicles.where((v) {
      if (q.isEmpty) return true;
      final plate = (v['plate'] ?? v['plateNumber'] ?? '').toString().toLowerCase();
      final model = _brandModel(v).toLowerCase();
      return plate.contains(q) || model.contains(q);
    }).toList();

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
        child: TextField(
          controller: _searchStore,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: fieldDecor('Araç ara (plaka, model...)').copyWith(
            prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
          ),
          onChanged: (_) => setState(() {}),
        ),
      ),
      Expanded(
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            // ── Incoming Requests section ──
            if (_allRentals.any((r) => r['rentedCompanyId'] == _myCompanyId && (r['status'] == null || r['status'] == 'Pending') && r['isCompleted'] == false)) ...[
              Row(children: [
                const Icon(Icons.mark_email_unread_outlined, color: Colors.orangeAccent, size: 16),
                const SizedBox(width: 6),
                const Text('Gelen Kiralama Talepleri', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              ]),
              const SizedBox(height: 8),
              ..._allRentals.where((r) => r['rentedCompanyId'] == _myCompanyId && (r['status'] == null || r['status'] == 'Pending') && r['isCompleted'] == false).map((r) {
                final plate = r['vehiclePlate'] ?? '—';
                final sDate = (r['startDate']?.toString() ?? '').split('T').first;
                final eDate = (r['endDate']?.toString() ?? '').split('T').first;
                return _sectionCard(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      const Icon(Icons.directions_car, color: Colors.orangeAccent, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(plate, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                      kBadge('Yeni Talep', Colors.orangeAccent),
                    ]),
                    const SizedBox(height: 4),
                    _infoRow('Talep Eden', r['renterCompanyName'] ?? 'Şirket #${r['renterCompanyId']}'),
                    _infoRow('Tarih', '$sDate – $eDate'),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.close, size: 14, color: Colors.redAccent),
                          label: const Text('Reddet', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                          style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                          onPressed: () => _handleRentalAction(r['id'], false, plate),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.check, size: 14, color: kGreen),
                          label: const Text('Onayla', style: TextStyle(color: kGreen, fontSize: 12)),
                          style: OutlinedButton.styleFrom(side: const BorderSide(color: kGreen), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                          onPressed: () => _handleRentalAction(r['id'], true, plate),
                        ),
                      ),
                    ]),
                  ],
                ));
              }),
              const Divider(color: kBorder, height: 28),
            ],

            // ── Listed vehicles section ──
            Row(children: [
              const Icon(Icons.store, color: kGreen, size: 16),
              const SizedBox(width: 6),
              const Text('Mağazadaki Araçlarım', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              const Spacer(),
              Text('${listed.length} araç', style: const TextStyle(color: kMuted, fontSize: 12)),
            ]),
            const SizedBox(height: 8),
            if (listed.isEmpty)
              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text('Mağazada araç yok.', style: TextStyle(color: kMuted, fontSize: 13)),
              )
            else
              ...listed.map((v) {
                final plate = v['plate'] ?? v['plateNumber'] ?? '—';
                final price = (v['baseRentPrice'] as num?)?.toStringAsFixed(0) ?? '0';
                final model = _brandModel(v);
                // Check if this vehicle is currently rented out
                final isRentedOut = _allRentals.any((r) =>
                    r['vehiclePlate'] == plate &&
                    r['isCompleted'] == false &&
                    r['rentedCompanyId'] == _myCompanyId);

                return _sectionCard(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Icon(Icons.directions_car, color: isRentedOut ? Colors.orangeAccent : kGreen, size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(plate, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        if (model != '—') Text(model, style: const TextStyle(color: kMuted, fontSize: 11)),
                        Text('₺$price/gün', style: const TextStyle(color: kMuted, fontSize: 12)),
                      ])),
                      if (isRentedOut)
                        kBadge('Kirada', Colors.orangeAccent)
                      else
                        kBadge('Mağazada', kGreen),
                    ]),
                    if (!isRentedOut) ...[
                      const SizedBox(height: 8),
                      Row(children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.edit, size: 14, color: kBlue),
                            label: const Text('Fiyat Güncelle', style: TextStyle(color: kBlue, fontSize: 12)),
                            style: OutlinedButton.styleFrom(side: const BorderSide(color: kBlue), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                            onPressed: () => _showUpdatePriceDialog(v),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.remove_circle_outline, size: 14, color: Colors.redAccent),
                            label: const Text('Çıkar', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                            style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                            onPressed: () => _removeFromStore(v),
                          ),
                        ),
                      ]),
                    ],
                  ],
                ));
              }),

            const Divider(color: kBorder, height: 28),

            // ── Add to store section ──
            Row(children: [
              const Icon(Icons.add_circle_outline, color: kBlue, size: 16),
              const SizedBox(width: 6),
              const Text('Mağazaya Ekle', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
            ]),
            const SizedBox(height: 8),
            if (_myUnlistedVehicles.isEmpty)
              const Text('Mağazaya eklenebilecek araç yok.', style: TextStyle(color: kMuted, fontSize: 13))
            else
              _AddToStoreForm(vehicles: _myUnlistedVehicles, onSubmit: _addToStore),
          ],
        ),
      ),
    ]);
  }

  Future<void> _handleRentalAction(int id, bool approve, String plate) async {
    setState(() => _loading = true);
    try {
      if (approve) {
        await _api.approveRental(id);
        if (mounted) kSuccess(context, 'Kiralama talebi onaylandı!');
      } else {
        await _api.rejectRental(id);
        // If rejected, the vehicle becomes available again
        await _api.patchVehicleActive(plate, true);
        if (mounted) kSuccess(context, 'Kiralama talebi reddedildi.');
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'İşlem başarısız: $e');
    }
  }

  Future<void> _showUpdatePriceDialog(Map<String, dynamic> v) async {
    final plate = v['plate'] ?? v['plateNumber'] ?? '';
    final currentPrice = (v['baseRentPrice'] as num?)?.toStringAsFixed(0) ?? '0';
    final priceC = TextEditingController(text: currentPrice);

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: Text('Fiyat Güncelle — $plate', style: const TextStyle(color: Colors.white, fontSize: 15)),
        content: kField('Günlük Kira Fiyatı (₺)', priceC, type: TextInputType.number),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Güncelle', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final newPrice = double.tryParse(priceC.text);
    if (newPrice == null || newPrice <= 0) { if (mounted) kError(context, 'Geçerli bir fiyat girin'); return; }
    setState(() => _loading = true);
    try {
      await _api.patchVehicleRentPrice(plate, newPrice);
      if (mounted) kSuccess(context, '$plate fiyatı güncellendi: ₺${newPrice.toStringAsFixed(0)}/gün');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'İşlem başarısız: $e');
    }
  }

  Future<void> _removeFromStore(Map<String, dynamic> v) async {
    final plate = v['plate'] ?? v['plateNumber'] ?? '';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Mağazadan Çıkar', style: TextStyle(color: Colors.white)),
        content: Text('$plate plaka numaralı araç kiralık listesinden çıkarılacak.', style: const TextStyle(color: kMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal', style: TextStyle(color: kMuted))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Çıkar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _loading = true);
    try {
      await _api.patchVehicleRentPrice(plate, 0);
      if (mounted) kSuccess(context, '$plate mağazadan çıkarıldı.');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'İşlem başarısız: $e');
    }
  }

  Future<void> _addToStore(String plate, double price) async {
    setState(() => _loading = true);
    try {
      await _api.patchVehicleRentPrice(plate, price);
      if (mounted) kSuccess(context, '$plate mağazaya eklendi. ₺${price.toStringAsFixed(0)}/gün');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      if (mounted) kError(context, 'İşlem başarısız: $e');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BUILD
  // ══════════════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        color: kCard,
        child: TabBar(
          controller: _tab,
          indicatorColor: kBlue,
          labelColor: Colors.white,
          unselectedLabelColor: kMuted,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Kiralık Araçlar'),
            Tab(text: 'Kiraladıklarım'),
            Tab(text: 'Mağazam'),
          ],
        ),
      ),
      Expanded(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: kBlue))
            : TabBarView(controller: _tab, children: [
                _buildHireMarket(),
                _buildMyRentals(),
                _buildMyStore(),
              ]),
      ),
    ]);
  }
}

// ── Add-to-store inline form ───────────────────────────────────────────────
class _AddToStoreForm extends StatefulWidget {
  final List<Map<String, dynamic>> vehicles;
  final Future<void> Function(String plate, double price) onSubmit;
  const _AddToStoreForm({required this.vehicles, required this.onSubmit});
  @override
  State<_AddToStoreForm> createState() => _AddToStoreFormState();
}

class _AddToStoreFormState extends State<_AddToStoreForm> {
  Map<String, dynamic>? _selected;
  final _priceC = TextEditingController();
  bool _busy = false;

  @override
  void dispose() { _priceC.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        DropdownButtonFormField<Map<String, dynamic>>(
          value: _selected,
          dropdownColor: kCard,
          isExpanded: true,
          menuMaxHeight: 250,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: fieldDecor('Araç Seçin'),
          items: widget.vehicles.map((v) {
            final p = v['plate'] ?? v['plateNumber'] ?? '—';
            return DropdownMenuItem(value: v, child: Text(p));
          }).toList(),
          onChanged: (v) => setState(() => _selected = v),
        ),
        const SizedBox(height: 10),
        kField('Günlük Kira Fiyatı (₺)', _priceC, type: TextInputType.number),
        const SizedBox(height: 4),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            icon: _busy ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.storefront, size: 16, color: Colors.white),
            label: const Text('Mağazaya Ekle', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: kBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: _busy ? null : () async {
              if (_selected == null) { kError(context, 'Araç seçin'); return; }
              final price = double.tryParse(_priceC.text);
              if (price == null || price <= 0) { kError(context, 'Geçerli bir fiyat girin'); return; }
              setState(() => _busy = true);
              await widget.onSubmit(_selected!['plate'] ?? _selected!['plateNumber'] ?? '', price);
              if (mounted) setState(() { _busy = false; _selected = null; _priceC.clear(); });
            },
          ),
        ),
      ]),
    );
  }
}
