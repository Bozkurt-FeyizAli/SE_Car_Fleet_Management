import 'package:flutter/material.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Accident Tab — matches web AccidentReportTab.tsx (fully functional form)
// ══════════════════════════════════════════════════════════════════════════════
class DriverAccidentTab extends StatefulWidget {
  const DriverAccidentTab({super.key});
  @override
  State<DriverAccidentTab> createState() => _DriverAccidentTabState();
}

class _DriverAccidentTabState extends State<DriverAccidentTab> {
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

  void _submit() {
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
    _location.clear();
    _desc.clear();
    kSuccess(context, 'Kaza bildirimi başarıyla gönderildi');
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
