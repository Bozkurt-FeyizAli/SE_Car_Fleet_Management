import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

class AdminLocationsTab extends StatefulWidget {
  final UserModel user;
  const AdminLocationsTab({super.key, required this.user});
  @override
  State<AdminLocationsTab> createState() => _State();
}

class _State extends State<AdminLocationsTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _locations = [];
  bool _loading = true;

  int get _companyId => widget.user.companyId ?? 1;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _api.getLocationsByCompany(_companyId);
      if (!mounted) return;
      setState(() {
        _locations = List<Map<String, dynamic>>.from(list);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Depolar yüklenemedi: $e');
    }
  }

  Future<void> _openAddDialog() async {
    final nameC = TextEditingController();
    final addressC = TextEditingController();
    final cityC = TextEditingController();
    final districtC = TextEditingController();
    final neighborhoodC = TextEditingController();
    final zipCodeC = TextEditingController();
    final latC = TextEditingController();
    final lngC = TextEditingController();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text(
          'Yeni Depo Ekle',
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            kField('Depo Adı *', nameC),
            kField('İl *', cityC),
            kField('İlçe *', districtC),
            kField('Mahalle *', neighborhoodC),
            kField('Tam Adres *', addressC),
            kField('Posta Kodu *', zipCodeC),
            kField('Enlem (Lat)', latC, type: TextInputType.numberWithOptions(decimal: true, signed: true)),
            kField('Boylam (Lng)', lngC, type: TextInputType.numberWithOptions(decimal: true, signed: true)),
          ]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('İptal', style: TextStyle(color: kMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Kaydet', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (ok != true || !mounted) return;
    final nameText = nameC.text.trim();
    final addressText = addressC.text.trim();
    final cityText = cityC.text.trim();
    final districtText = districtC.text.trim();
    final neighborhoodText = neighborhoodC.text.trim();
    final zipCodeText = zipCodeC.text.trim();
    final latText = latC.text.trim();
    final lngText = lngC.text.trim();

    if (nameText.isEmpty || addressText.isEmpty || cityText.isEmpty || districtText.isEmpty || neighborhoodText.isEmpty || zipCodeText.isEmpty) {
      if (mounted) kError(context, 'Tüm yıldızlı (*) alanlar zorunludur');
      return;
    }

    final latStr = latText.replaceAll(',', '.');
    final lngStr = lngText.replaceAll(',', '.');
    
    double lat = 0.0;
    if (latStr.isNotEmpty) {
      final parsed = double.tryParse(latStr);
      if (parsed == null || parsed < -90 || parsed > 90) {
        if (mounted) kError(context, 'Geçerli bir enlem (latitude) değeri girin (-90 ile 90 arası)');
        return;
      }
      lat = parsed;
    }

    double lng = 0.0;
    if (lngStr.isNotEmpty) {
      final parsed = double.tryParse(lngStr);
      if (parsed == null || parsed < -180 || parsed > 180) {
        if (mounted) kError(context, 'Geçerli bir boylam (longitude) değeri girin (-180 ile 180 arası)');
        return;
      }
      lng = parsed;
    }

    setState(() => _loading = true);
    try {
      await _api.createLocation({
        'companyId': _companyId,
        'locationName': nameText,
        'latitude': lat,
        'longitude': lng,
        'address': {
          'city': cityText,
          'district': districtText,
          'neighborhood': neighborhoodText,
          'fullAddress': addressText,
          'zipCode': zipCodeText,
        },
      });
      if (mounted) kSuccess(context, '$nameText başarıyla eklendi!');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Eklenemedi: $e');
    }
  }

  Future<void> _deleteLocation(Map<String, dynamic> loc) async {
    final id = loc['id'];
    if (id == null) return;
    
    final ok = await kConfirm(context, 'Depo Sil', '${loc['locationName']} adlı depoyu silmek istiyor musunuz?');
    if (ok != true) return;
    
    setState(() => _loading = true);
    try {
      await _api.deleteLocation(id);
      if (mounted) kSuccess(context, 'Depo silindi');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Silinemedi: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _locations.where((l) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final name = (l['locationName'] ?? '').toString().toLowerCase();
      final address = (l['address']?['fullAddress'] ?? l['fullAddress'] ?? '').toString().toLowerCase();
      return name.contains(q) || address.contains(q);
    }).toList();

    return Stack(children: [
      Container(
        color: kBg,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                style: const TextStyle(color: Colors.white),
                decoration: fieldDecor('Depo ara...').copyWith(
                  prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
                ),
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val;
                  });
                },
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kBlue))
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.warehouse_outlined, size: 56, color: kMuted),
                              const SizedBox(height: 14),
                              Text(
                                _locations.isEmpty ? 'Henüz depo kaydı yok.' : 'Arama sonucu bulunamadı.',
                                style: const TextStyle(color: kMuted, fontSize: 15),
                              ),
                              if (_locations.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.only(top: 6),
                                  child: Text(
                                    '+ düğmesine basarak ekleyin.',
                                    style: const TextStyle(color: kMuted, fontSize: 13),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) => _buildCard(filtered[i]),
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
          onPressed: _openAddDialog,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text('Depo Ekle', style: TextStyle(color: Colors.white)),
        ),
      ),
    ]);
  }

  Widget _buildCard(Map<String, dynamic> loc) {
    final name = loc['locationName'] ?? '—';
    final address = loc['address']?['fullAddress'] ?? loc['fullAddress'] ?? '—';
    final lat = (loc['latitude'] as num?)?.toStringAsFixed(5) ?? '—';
    final lng = (loc['longitude'] as num?)?.toStringAsFixed(5) ?? '—';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: kBorder)),
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: kBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.warehouse_outlined, color: kBlue, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              kBadge('Aktif', kGreen),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: kMuted),
                color: kCard,
                onSelected: (val) {
                  if (val == 'delete') _deleteLocation(loc);
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Sil', style: TextStyle(color: Colors.redAccent)),
                  ),
                ],
              ),
            ]),
          ),
          // ── Body ──
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _infoRow(Icons.location_on_outlined, 'Adres', address),
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: _coordBox('Enlem', lat, Icons.north)),
                const SizedBox(width: 8),
                Expanded(child: _coordBox('Boylam', lng, Icons.east)),
              ]),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 14, color: kMuted),
      const SizedBox(width: 6),
      Text('$label: ', style: const TextStyle(color: kMuted, fontSize: 12)),
      Expanded(
        child: Text(
          value,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ),
    ],
  );

  Widget _coordBox(String label, String value, IconData icon) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: kBg,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: kBorder),
    ),
    child: Row(children: [
      Icon(icon, size: 12, color: kMuted),
      const SizedBox(width: 6),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: kMuted, fontSize: 10)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    ]),
  );
}
