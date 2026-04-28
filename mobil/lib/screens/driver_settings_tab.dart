import 'package:flutter/material.dart';
import 'shared_styles.dart';

const _emerald = Color(0xFF059669);

// ══════════════════════════════════════════════════════════════════════════════
// Settings Tab — matches web driver/tabs/SettingsTab.tsx
// ══════════════════════════════════════════════════════════════════════════════
class DriverSettingsTab extends StatefulWidget {
  final VoidCallback onLogout;
  const DriverSettingsTab({super.key, required this.onLogout});
  @override
  State<DriverSettingsTab> createState() => _DriverSettingsTabState();
}

class _DriverSettingsTabState extends State<DriverSettingsTab> {
  bool _notifications = true;
  bool _locationSharing = true;
  bool _darkMode = true;
  String _language = 'tr';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ayarlar',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),

          _card(Icons.notifications_rounded, 'Bildirim Ayarları', [
            _toggle(
              'Uygulama bildirimleri',
              _notifications,
              (v) => setState(() => _notifications = v),
            ),
            _toggle(
              'Konum paylaşımı',
              _locationSharing,
              (v) => setState(() => _locationSharing = v),
            ),
          ]),
          const SizedBox(height: 14),

          _card(Icons.palette_rounded, 'Görünüm', [
            _toggle(
              'Koyu mod',
              _darkMode,
              (v) => setState(() => _darkMode = v),
            ),
            kLabel('Dil'),
            kDropdown(
              _language,
              ['tr', 'en'],
              ['Türkçe', 'English'],
              (v) => setState(() => _language = v!),
            ),
          ]),
          const SizedBox(height: 14),

          _card(Icons.info_rounded, 'Uygulama Hakkında', [
            _infoRow('Versiyon', '1.0.0'),
            _infoRow('Geliştirici', 'SE Fleet Management'),
          ]),
          const SizedBox(height: 14),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: widget.onLogout,
              icon: const Icon(
                Icons.logout_rounded,
                size: 18,
                color: Colors.white,
              ),
              label: const Text(
                'Çıkış Yap',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _card(IconData icon, String title, List<Widget> children) => Container(
    padding: const EdgeInsets.all(14),
    margin: EdgeInsets.zero,
    decoration: BoxDecoration(
      color: kCard,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: kBorder),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: kMuted, size: 16),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...children,
      ],
    ),
  );

  Widget _toggle(String label, bool value, ValueChanged<bool> onChange) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          children: [
            Switch(
              value: value,
              onChanged: onChange,
              activeThumbColor: _emerald,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
      );

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: kMuted, fontSize: 13),
          ),
        ),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 13)),
      ],
    ),
  );
}
