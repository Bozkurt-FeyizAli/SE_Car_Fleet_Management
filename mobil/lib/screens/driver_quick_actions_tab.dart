import 'package:flutter/material.dart';
import 'shared_styles.dart';

class DriverQuickActionsTab extends StatefulWidget {
  const DriverQuickActionsTab({super.key});
  @override
  State<DriverQuickActionsTab> createState() => _DriverQuickActionsTabState();
}

class _DriverQuickActionsTabState extends State<DriverQuickActionsTab> {
  String? _activeSection;

  final _sections = const [
    (id: 'maintenance', label: 'Bakım Talep Et', icon: Icons.build_rounded, color: Color(0xFF1D4ED8), desc: 'Aracınız için bakım talebi oluşturun'),
    (id: 'issue', label: 'Sorun Bildir', icon: Icons.warning_amber_rounded, color: Color(0xFFD97706), desc: 'Araçla ilgili sorun bildirin'),
    (id: 'daily_check', label: 'Günlük Kontrol', icon: Icons.checklist_rounded, color: Color(0xFF059669), desc: 'Günlük araç kontrolü yapın'),
  ];

  @override
  Widget build(BuildContext context) {
    if (_activeSection != null) {
      return Column(
        children: [
          Container(
            color: kBg,
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() => _activeSection = null),
                icon: const Icon(Icons.arrow_back_rounded, size: 18, color: kMuted),
                label: const Text('Geri', style: TextStyle(color: kMuted)),
              ),
            ),
          ),
          Expanded(child: _buildSection()),
        ],
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Hızlı İşlemler', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
            children: _sections.map((s) => GestureDetector(
              onTap: () => setState(() => _activeSection = s.id),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: s.color.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: s.color.withValues(alpha: 0.25)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(color: s.color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                      child: Icon(s.icon, color: s.color, size: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(s.label, style: TextStyle(color: s.color, fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Expanded(child: Text(s.desc, style: const TextStyle(color: kMuted, fontSize: 10), maxLines: 2, overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ),
            )).toList(),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildSection() {
    switch (_activeSection) {
      case 'maintenance': return const _MaintenanceSection();
      case 'issue': return const _IssueSection();
      case 'daily_check': return const _DailyCheckSection();
      default: return const SizedBox.shrink();
    }
  }
}

// ─── Maintenance ────────────────────────────────────────────────────────────
class _MaintenanceSection extends StatefulWidget {
  const _MaintenanceSection();
  @override
  State<_MaintenanceSection> createState() => _MaintenanceSectionState();
}

class _MaintenanceSectionState extends State<_MaintenanceSection> {
  final List<Map<String, dynamic>> _requests = [];
  String _type = 'Periyodik Bakım';
  String _urgency = 'medium';
  final _desc = TextEditingController();
  final _types = ['Periyodik Bakım','Lastik Değişimi','Fren Bakımı','Motor Bakımı','Yağ Değişimi','Diğer'];

  @override
  void dispose() { _desc.dispose(); super.dispose(); }

  void _submit() {
    if (_desc.text.isEmpty) { kError(context, 'Açıklama girin'); return; }
    setState(() {
      _requests.insert(0, {'date': DateTime.now().toIso8601String().substring(0,10), 'type': _type, 'urgency': _urgency, 'desc': _desc.text, 'status': 'pending'});
      _desc.clear();
    });
    kSuccess(context, 'Bakım talebi gönderildi');
  }

  String _urgencyLabel(String u) => u == 'high' ? 'Yüksek' : u == 'medium' ? 'Orta' : 'Düşük';
  Color _urgencyColor(String u) => u == 'high' ? Colors.red : u == 'medium' ? Colors.orange : kGreen;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Row(children: [Icon(Icons.build_rounded, color: kBlue, size: 18), SizedBox(width: 8), Text('Yeni Bakım Talebi', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600))]),
              const SizedBox(height: 14),
              kLabel('Bakım Tipi'), kDropdown(_type, _types, _types, (v) => setState(() => _type = v!)),
              kLabel('Aciliyet'), kDropdown(_urgency, ['low','medium','high'], ['Düşük','Orta','Yüksek'], (v) => setState(() => _urgency = v!)),
              kField('Açıklama *', _desc),
              SizedBox(width: double.infinity, child: ElevatedButton.icon(style: ElevatedButton.styleFrom(backgroundColor: kBlue), onPressed: _submit, icon: const Icon(Icons.send_rounded, size: 16, color: Colors.white), label: const Text('Talep Gönder', style: TextStyle(color: Colors.white)))),
            ]),
          ),
          if (_requests.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text('Geçmiş Taleplerim', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            ..._requests.map((r) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [Expanded(child: Text(r['type'], style: const TextStyle(color: Colors.white, fontSize: 13))), kBadge(_urgencyLabel(r['urgency']), _urgencyColor(r['urgency'])), const SizedBox(width: 6), kBadge('Beklemede', Colors.orange)]),
                const SizedBox(height: 4),
                Text(r['desc'], style: const TextStyle(color: kMuted, fontSize: 12)),
                Text(r['date'], style: const TextStyle(color: kMuted, fontSize: 11)),
              ]),
            )),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

// ─── Issue Report ────────────────────────────────────────────────────────────
class _IssueSection extends StatefulWidget {
  const _IssueSection();
  @override
  State<_IssueSection> createState() => _IssueSectionState();
}

class _IssueSectionState extends State<_IssueSection> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _priority = 'medium';
  @override
  void dispose() { _title.dispose(); _desc.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 18), SizedBox(width: 8), Text('Sorun Bildir', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600))]),
          const SizedBox(height: 14),
          kField('Sorun Başlığı', _title, hint: 'Sorunun kısa açıklaması'),
          kLabel('Öncelik'), kDropdown(_priority, ['low','medium','high'], ['Düşük','Orta','Yüksek'], (v) => setState(() => _priority = v!)),
          kField('Detaylı Açıklama', _desc, hint: 'Sorunu detaylı açıklayın...'),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD97706)),
            onPressed: () { if (_title.text.isEmpty) { kError(context, 'Başlık girin'); return; } _title.clear(); _desc.clear(); kSuccess(context, 'Sorun bildirimi gönderildi'); },
            icon: const Icon(Icons.send_rounded, size: 16, color: Colors.white),
            label: const Text('Bildir', style: TextStyle(color: Colors.white)),
          )),
        ]),
      ),
    );
  }
}


// ─── Daily Check ──────────────────────────────────────────────────────────────
class _DailyCheckSection extends StatefulWidget {
  const _DailyCheckSection();
  @override
  State<_DailyCheckSection> createState() => _DailyCheckSectionState();
}

class _DailyCheckSectionState extends State<_DailyCheckSection> {
  String _tire = 'good', _brake = 'good', _light = 'good', _oil = 'good';
  final _fuel = TextEditingController(text: '100');
  final _km = TextEditingController();
  final _notes = TextEditingController();
  final List<Map<String, dynamic>> _history = [];

  @override
  void dispose() { _fuel.dispose(); _km.dispose(); _notes.dispose(); super.dispose(); }

  void _submit() {
    if (_km.text.isEmpty) { kError(context, 'Kilometre bilgisini girin'); return; }
    setState(() => _history.insert(0, {'date': DateTime.now().toIso8601String().substring(0,10), 'tire': _tire, 'brake': _brake, 'light': _light, 'oil': _oil, 'fuel': _fuel.text, 'km': _km.text, 'notes': _notes.text}));
    _km.clear(); _notes.clear();
    kSuccess(context, 'Günlük kontrol kaydedildi');
  }

  String _cLabel(String c) => c == 'good' ? 'İyi' : c == 'fair' ? 'Orta' : 'Kötü';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: kBorder)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [Icon(Icons.checklist_rounded, color: kGreen, size: 18), SizedBox(width: 8), Text('Günlük Araç Kontrolü', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600))]),
            const SizedBox(height: 4),
            const Text('Yola çıkmadan önce araç kontrolünüzü yapın', style: TextStyle(color: kMuted, fontSize: 12)),
            const SizedBox(height: 14),
            kLabel('Lastik Durumu'), kDropdown(_tire, ['good','fair','poor'], ['İyi','Orta','Kötü'], (v) => setState(() => _tire = v!)),
            kLabel('Fren Durumu'), kDropdown(_brake, ['good','fair','poor'], ['İyi','Orta','Kötü'], (v) => setState(() => _brake = v!)),
            kLabel('Işık Durumu'), kDropdown(_light, ['good','fair','poor'], ['İyi','Orta','Kötü'], (v) => setState(() => _light = v!)),
            kLabel('Yağ Seviyesi'), kDropdown(_oil, ['good','fair','poor'], ['İyi','Orta','Kötü'], (v) => setState(() => _oil = v!)),
            kField('Yakıt Seviyesi (%)', _fuel, type: TextInputType.number),
            kField('Kilometre *', _km, type: TextInputType.number),
            kField('Notlar', _notes),
            SizedBox(width: double.infinity, child: ElevatedButton.icon(style: ElevatedButton.styleFrom(backgroundColor: kGreen), onPressed: _submit, icon: const Icon(Icons.check_circle_rounded, size: 16, color: Colors.white), label: const Text('Kontrolü Kaydet', style: TextStyle(color: Colors.white)))),
          ]),
        ),
        if (_history.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Geçmiş Kontrollerim', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ..._history.map((h) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Text(h['date'], style: const TextStyle(color: kMuted, fontSize: 11)), const Spacer(), Text('${h['km']} km', style: const TextStyle(color: Colors.white, fontSize: 12))]),
              const SizedBox(height: 6),
              Wrap(spacing: 6, children: [kBadge('Lastik: ${_cLabel(h['tire'])}', kGreen), kBadge('Fren: ${_cLabel(h['brake'])}', kBlue), kBadge('Yakıt: ${h['fuel']}%', const Color(0xFFD97706))]),
            ]),
          )),
        ],
        const SizedBox(height: 80),
      ]),
    );
  }
}
