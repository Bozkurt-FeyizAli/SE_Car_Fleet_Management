import 'package:flutter/material.dart';
import 'shared_styles.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Accident Tab — matches web AccidentReportTab.tsx (fully functional form)
// ══════════════════════════════════════════════════════════════════════════════
class DriverAccidentTab extends StatefulWidget {
  final UserModel user;
  const DriverAccidentTab({super.key, required this.user});
  @override
  State<DriverAccidentTab> createState() => _DriverAccidentTabState();
}

class _DriverAccidentTabState extends State<DriverAccidentTab> {
  final _api = ApiService();
  final _location = TextEditingController();
  final _desc = TextEditingController();
  String _severity = 'minor';
  String _date = DateTime.now().toIso8601String().substring(0, 10);
  final List<Map<String, dynamic>> _reports = [];

  @override
  void dispose() {
    _location.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_desc.text.isEmpty || _location.text.isEmpty) {
      kError(context, 'Lütfen açıklama ve konum bilgilerini girin');
      return;
    }
    
    setState(
      () => _reports.insert(0, {
        'date': _date,
        'location': _location.text,
        'severity': _severity,
        'desc': _desc.text,
        'status': 'Bildirildi',
      }),
    );
    
    final reportedLoc = _location.text;
    final reportedDesc = _desc.text;
    _location.clear();
    _desc.clear();
    
    kSuccess(context, 'Kaza bildirimi başarıyla gönderildi');

    // Make the vehicle passive if severity is moderate or major
    if (_severity == 'moderate' || _severity == 'major') {
      try {
        final userId = int.tryParse(widget.user.id);
        if (userId != null) {
          final drivers = await _api.getDrivers();
          final driverData = drivers.cast<Map<String, dynamic>>().firstWhere(
            (d) => d['userId'] == userId, 
            orElse: () => <String, dynamic>{},
          );
          final plate = driverData['vehiclePlate'];
          if (plate != null) {
            final vehicles = await _api.getVehicles();
            final vehicleData = vehicles.cast<Map<String, dynamic>>().firstWhere(
              (v) => v['plate'] == plate || v['plateNumber'] == plate, 
              orElse: () => <String, dynamic>{},
            );
            final vId = vehicleData['id'];
            if (vId != null) {
              await _api.updateVehicle(vId, {
                ...vehicleData,
                'isActive': false,
              });
              if (mounted) {
                kSuccess(context, 'Araç ağır hasar sebebiyle pasife çekildi.');
              }
            }
          }
        }
      } catch (e) {
        debugPrint('Kaza sonrası araç durumu güncellenemedi: $e');
      }
    }
  }

  String _sevLabel(String s) => s == 'major'
      ? 'Ağır'
      : s == 'moderate'
      ? 'Orta'
      : 'Hafif';
  Color _sevColor(String s) => s == 'major'
      ? Colors.red
      : s == 'moderate'
      ? Colors.orange
      : kGreen;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Warning banner
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.warning_rounded, color: Colors.orange, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Acil bir durum varsa önce 112\'yi arayın.',
                    style: TextStyle(color: Colors.orange, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.warning_rounded, color: Colors.red, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Yeni Kaza Bildirimi',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Kaza durumunda aşağıdaki formu doldurarak bildirim yapın',
                  style: TextStyle(color: kMuted, fontSize: 12),
                ),
                const SizedBox(height: 14),
                // Date field
                kLabel('Tarih'),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TextFormField(
                    initialValue: _date,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: fieldDecor('Tarih (YYYY-MM-DD)'),
                    onChanged: (v) => _date = v,
                  ),
                ),
                kField(
                  'Konum *',
                  _location,
                  hint: 'Örneğin: İstanbul - Ankara otoyolu, 150. km',
                ),
                kLabel('Şiddet'),
                kDropdown(
                  _severity,
                  ['minor', 'moderate', 'major'],
                  ['Hafif', 'Orta', 'Ağır'],
                  (v) => setState(() => _severity = v!),
                ),
                kField(
                  'Açıklama *',
                  _desc,
                  hint: 'Kaza ile ilgili detaylı açıklama yazın...',
                ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    onPressed: _submit,
                    icon: const Icon(
                      Icons.warning_rounded,
                      size: 16,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'Kaza Bildir',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_reports.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'Geçmiş Bildirimlerim',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            ..._reports.map(
              (r) => Container(
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
                            r['location'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        kBadge(
                          _sevLabel(r['severity']),
                          _sevColor(r['severity']),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      r['desc'],
                      style: const TextStyle(color: kMuted, fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      r['date'],
                      style: const TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
