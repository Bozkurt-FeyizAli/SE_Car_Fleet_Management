import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// System Admin Locations Tab — shows ALL locations across all companies
// Separate from AdminLocationsTab used by company managers
// ══════════════════════════════════════════════════════════════════════════════

class SysAdminLocationsTab extends StatefulWidget {
  final UserModel user;
  const SysAdminLocationsTab({super.key, required this.user});
  @override
  State<SysAdminLocationsTab> createState() => _State();
}

class _State extends State<SysAdminLocationsTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  Map<int, String> _companyNames = {};
  bool _loading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final companies = await _api.getCompanies().catchError((_) => <dynamic>[]);
      final cList = (companies as List).cast<Map<String, dynamic>>();

      final cMap = <int, String>{};
      for (final c in cList) {
        final id = (c['id'] as num?)?.toInt();
        if (id != null) cMap[id] = c['companyName'] ?? c['name'] ?? '—';
      }

      // Fetch locations for each company in parallel
      final validCompanies = cList.where((c) => c['id'] != null).toList();
      final futures = validCompanies.map((c) {
        final cId = (c['id'] as num).toInt();
        return _api.getLocationsByCompany(cId).catchError((_) => <dynamic>[]);
      });
      final results = await Future.wait(futures);

      final allLocs = <Map<String, dynamic>>[];
      for (var i = 0; i < validCompanies.length; i++) {
        final cId = (validCompanies[i]['id'] as num).toInt();
        final locs = (results[i] as List).cast<Map<String, dynamic>>();
        for (final loc in locs) {
          loc['companyId'] = cId;
          allLocs.add(loc);
        }
      }

      if (!mounted) return;
      setState(() {
        _all = allLocs;
        _companyNames = cMap;
        _filter();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      kError(context, 'Depolar yüklenemedi: $e');
    }
  }

  void _filter() {
    if (_searchQuery.isEmpty) {
      _shown = List.from(_all);
      return;
    }
    final q = _searchQuery.toLowerCase();
    _shown = _all.where((l) {
      final name = (l['locationName'] ?? '').toString().toLowerCase();
      final address = (l['address']?['fullAddress'] ?? l['fullAddress'] ?? '').toString().toLowerCase();
      final cId = (l['companyId'] as num?)?.toInt();
      final company = cId != null ? (_companyNames[cId] ?? '').toLowerCase() : '';
      return name.contains(q) || address.contains(q) || company.contains(q);
    }).toList();
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
    return Stack(children: [
      Container(
        color: kBg,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextField(
                style: const TextStyle(color: Colors.white),
                decoration: fieldDecor('Depo veya şirket ara...').copyWith(
                  prefixIcon: const Icon(Icons.search, color: kMuted, size: 20),
                ),
                onChanged: (val) => setState(() { _searchQuery = val; _filter(); }),
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: kBlue))
                  : _shown.isEmpty
                      ? const Center(
                          child: Text('Kayıt bulunamadı.', style: TextStyle(color: kMuted)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) => _buildCard(_shown[i]),
                        ),
            ),
          ],
        ),
      ),
    ]);
  }

  Widget _buildCard(Map<String, dynamic> loc) {
    final name = loc['locationName'] ?? '—';
    final address = loc['address']?['fullAddress'] ?? loc['fullAddress'] ?? '—';
    final cId = (loc['companyId'] as num?)?.toInt();
    final companyName = cId != null ? (_companyNames[cId] ?? '—') : '—';

    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
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
              child: const Icon(Icons.warehouse_outlined, color: kBlue, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    address,
                    style: const TextStyle(color: kMuted, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    companyName,
                    style: const TextStyle(color: kBlue, fontSize: 11),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: kMuted, size: 18),
              color: kCard,
              onSelected: (val) {
                if (val == 'delete') _deleteLocation(loc);
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'delete',
                  child: Text('Sil', style: TextStyle(color: Colors.redAccent)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
