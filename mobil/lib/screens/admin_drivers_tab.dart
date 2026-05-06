import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';
import 'driver_detail_screen.dart';

class AdminDriversTab extends StatefulWidget {
  final int? companyId;
  const AdminDriversTab({super.key, this.companyId});
  @override
  State<AdminDriversTab> createState() => _State();
}

class _State extends State<AdminDriversTab> {
  final _api = ApiService();
  List<Map<String, dynamic>> _all = [], _shown = [];
  Map<int, String> _managerNames = {};
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
      final results = await Future.wait([
        _api.getUsers(),
        _api.getDrivers(),
        _api.getManagers(),
      ]);
      if (!mounted) return;
      
      final users = results[0].cast<Map<String, dynamic>>();
      final drivers = results[1].cast<Map<String, dynamic>>();
      final managers = results[2].cast<Map<String, dynamic>>();
      
      // Build managerId -> name map
      final mNames = <int, String>{};
      for (final m in managers) {
        final mid = (m['id'] as num).toInt();
        final uid = m['userId'];
        final u = users.firstWhere((u) => u['id'] == uid, orElse: () => <String, dynamic>{});
        mNames[mid] = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
      }

      final combined = drivers.map((driver) {
        final userId = driver['userId'];
        final user = users.firstWhere((u) => u['id'] == userId, orElse: () => <String, dynamic>{});
        return {
          ...user,
          ...driver,
          'id': user['id'] ?? driver['userId'],
          'driverId': driver['id'],
          'userId': driver['userId'],
        };
      }).toList();

      setState(() {
        _managerNames = mNames;
        if (widget.companyId != null) {
          _all = combined.where((d) => d['companyId'] == widget.companyId).toList();
        } else {
          _all = combined;
        }
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
                (d) =>
                    '${d['driverName']} ${d['licenseNumber']}'
                        .toLowerCase()
                        .contains(q),
              )
              .toList();
  }

  Future<void> _openDetail({Map<String, dynamic>? item}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DriverDetailScreen(
          item: item,
          defaultCompanyId: widget.companyId ?? 1,
        ),
      ),
    );
    if (result == true) {
      _load();
    }
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final name = (item['driverName'] ?? '${item['firstName'] ?? ''} ${item['lastName'] ?? ''}').toString().trim();
    final ok = await kConfirm(
      context,
      'Şoför Sil',
      '"$name" şoförü silmek istiyor musunuz?',
    );
    if (ok == true) {
      try {
        if (item['driverId'] != null) {
          await _api.deleteDriver(item['driverId']);
        }
        if (item['userId'] != null) {
          await _api.deleteUser(item['userId']);
        }
        kSuccess(context, 'Silindi');
        _load();
      } catch (e) {
        kError(context, 'Silinemedi: $e');
      }
    }
  }

  Color _scoreColor(int? s) => (s ?? 0) >= 80
      ? Colors.green
      : (s ?? 0) >= 60
      ? Colors.orange
      : Colors.red;

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
                  decoration: fieldDecor('Şoför ara...').copyWith(
                    prefixIcon: const Icon(
                      Icons.search,
                      color: kMuted,
                      size: 20,
                    ),
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
                          child: Text(
                            'Kayıtlı şoför yok.',
                            style: TextStyle(color: kMuted),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 90),
                          itemCount: _shown.length,
                          itemBuilder: (_, i) {
                            final d = _shown[i];
                            final name = d['driverName']?.toString().trim() ?? '';
                            final score = (d['points'] as num?)?.toInt() ?? 100;
                            final statusLabel = d['status']?.toString() ?? 'active';
                            
                            return InkWell(
                              onTap: () => _openDetail(item: d),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: kCard,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kBorder),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            name.isEmpty ? '(isimsiz)' : name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        kBadge(
                                          kStatusLabel(statusLabel),
                                          kStatusColor(statusLabel),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Text(
                                          'Ehliyet: ${d['licenseNumber'] ?? '—'}',
                                          style: const TextStyle(
                                            color: kMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        const Text(
                                          'Puan: ',
                                          style: TextStyle(
                                            color: kMuted,
                                            fontSize: 12,
                                          ),
                                        ),
                                        Text(
                                          '${score ?? '—'}',
                                          style: TextStyle(
                                            color: _scoreColor(score),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (d['vehiclePlate'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 6),
                                        child: Text(
                                          'Atanan Araç: ${d['vehiclePlate']}',
                                          style: const TextStyle(color: Colors.lightBlueAccent, fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    if (d['parentManagerId'] != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          'Yönetici: ${_managerNames[(d['parentManagerId'] as num).toInt()] ?? 'Bilinmeyen'}',
                                          style: const TextStyle(color: Color(0xFF7C3AED), fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                    const SizedBox(height: 8),
                                    const Row(
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        Text('Detayları Gör', style: TextStyle(color: kBlue, fontSize: 12, fontWeight: FontWeight.bold)),
                                        Icon(Icons.chevron_right, color: kBlue, size: 16),
                                      ],
                                    ),
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
            onPressed: () => _openDetail(),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Şoför Ekle',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
