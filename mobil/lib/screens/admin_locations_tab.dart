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
            kField('Tam Adres *', addressC),
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
    final latText = latC.text.trim();
    final lngText = lngC.text.trim();

    if (nameText.isEmpty || addressText.isEmpty) {
      if (mounted) kError(context, 'Depo adı ve adres zorunludur');
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
        'address': {'fullAddress': addressText},
      });
      if (mounted) kSuccess(context, '$nameText başarıyla eklendi!');
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Eklenemedi: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Container(
        color: kBg,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: kBlue))
            : _locations.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.warehouse_outlined, size: 56, color: kMuted),
                        SizedBox(height: 14),
                        Text(
                          'Henüz depo kaydı yok.',
                          style: TextStyle(color: kMuted, fontSize: 15),
                        ),
                        SizedBox(height: 6),
                        Text(
                          '+ düğmesine basarak ekleyin.',
                          style: TextStyle(color: kMuted, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 90),
                    itemCount: _locations.length,
                    itemBuilder: (_, i) => _buildCard(_locations[i]),
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
    final address = loc['fullAddress'] ?? '—';
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
