import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Company Tab — matches web CompanyTab.tsx
// Fetches assigned company from API
// ══════════════════════════════════════════════════════════════════════════════
class DriverCompanyTab extends StatefulWidget {
  final UserModel user;
  const DriverCompanyTab({super.key, required this.user});
  @override
  State<DriverCompanyTab> createState() => _DriverCompanyTabState();
}

class _DriverCompanyTabState extends State<DriverCompanyTab> {
  final _api = ApiService();
  Map<String, dynamic>? _company;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final id = int.tryParse(widget.user.id);
      if (id != null) {
        final userData = await _api.getUser(id);
        final parentId = (userData as Map<String, dynamic>?)?['parentUserId'];
        if (parentId != null) {
          final companies = await _api.getCompanies();
          if (companies.isNotEmpty && mounted) {
            setState(
              () => _company = (companies.first as Map<String, dynamic>),
            );
          }
        } else {
          final companies = await _api.getCompanies();
          if (companies.isNotEmpty && mounted) {
            setState(
              () => _company = (companies.first as Map<String, dynamic>),
            );
          }
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Şirket Bilgileri',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Çalıştığınız şirkete ait bilgiler',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: kBlue))
          else if (_company == null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: kCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kBorder),
              ),
              child: const Center(
                child: Text(
                  'Şirket bilgisi bulunamadı.',
                  style: TextStyle(color: kMuted),
                ),
              ),
            )
          else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
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
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: kBlue.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.business_rounded,
                          color: kBlue,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _company!['name'] ?? '—',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            kBadge(
                              kStatusLabel(_company!['status']),
                              kStatusColor(_company!['status']),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _row(
                    'Adres',
                    _company!['address'] ?? '—',
                    Icons.location_on_rounded,
                  ),
                  _row(
                    'Telefon',
                    _company!['phone'] ?? '—',
                    Icons.phone_rounded,
                  ),
                  _row(
                    'E-posta',
                    _company!['email'] ?? '—',
                    Icons.email_rounded,
                  ),
                  _row(
                    'İletişim Kişisi',
                    _company!['contactPerson'] ?? '—',
                    Icons.person_rounded,
                  ),
                  _row(
                    'Website',
                    _company!['website'] ?? '—',
                    Icons.language_rounded,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _row(String label, String value, IconData icon) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        Icon(icon, color: kMuted, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: kMuted, fontSize: 11)),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
