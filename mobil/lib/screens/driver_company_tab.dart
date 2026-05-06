import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Company Tab — shows assigned company and manager info
// Fetches company & manager from API, fills missing fields with mock data
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
  Map<String, dynamic>? _managerUser;
  Map<String, dynamic>? _managerRecord;
  bool _loading = true;

  // Mock data for company fields the API doesn't return
  static const _mockCompanyExtras = {
    1: {
      'address': 'Atatürk Mah. Sanayi Cad. No:42, Kocaeli',
      'phone': '0262 555 44 33',
      'email': 'info@tasiyicilar.com.tr',
      'contactPerson': 'Ahmet Yılmaz',
      'website': 'www.tasiyicilar.com.tr',
      'sector': 'Kara Yolu Taşımacılığı',
      'founded': '2008',
    },
    3: {
      'address': 'Organize Sanayi Bölgesi 7. Cadde No:18, Bursa',
      'phone': '0224 411 22 00',
      'email': 'bilgi@anadolulojistik.com',
      'contactPerson': 'Mehmet Demir',
      'website': 'www.anadolulojistik.com',
      'sector': 'Lojistik & Depolama',
      'founded': '2012',
    },
    5: {
      'address': 'Yeni Mahalle Lojistik Sok. No:7, Ankara',
      'phone': '0312 333 11 22',
      'email': 'destek@furkansirket.com',
      'contactPerson': 'Furkan Kaya',
      'website': 'www.furkansirket.com',
      'sector': 'Yük Taşımacılığı',
      'founded': '2019',
    },
    7: {
      'address': 'Cumhuriyet Blv. No:55, Adana',
      'phone': '0322 777 88 99',
      'email': 'info@ceyhanlilar.com',
      'contactPerson': 'İkbal Ceyhan',
      'website': 'www.ceyhanlilar.com',
      'sector': 'Uluslararası Taşımacılık',
      'founded': '2015',
    },
  };

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
        final results = await Future.wait([
          _api.getUser(id),
          _api.getCompanies(),
          _api.getManagers(),
          _api.getUsers(),
        ]);

        final userData = results[0] as Map<String, dynamic>;
        final companies = (results[1] as List).cast<Map<String, dynamic>>();
        final managers = (results[2] as List).cast<Map<String, dynamic>>();
        final users = (results[3] as List).cast<Map<String, dynamic>>();

        // Fetch company
        final companyId = (userData['companyId'] as num?)?.toInt();
        if (companyId != null) {
          final myCompany = companies.firstWhere(
            (c) => (c['id'] as num).toInt() == companyId,
            orElse: () => <String, dynamic>{},
          );
          if (myCompany.isNotEmpty && mounted) {
            // Merge mock extras for missing fields
            final extras = _mockCompanyExtras[companyId] ?? _mockCompanyExtras[1]!;
            _company = {
              ...myCompany,
              ...extras,
            };
          }
        }

        // Fetch manager: parentManagerId -> Manager.id -> Manager.userId -> User
        final pmId = (userData['parentManagerId'] as num?)?.toInt();
        if (pmId != null) {
          final manager = managers.firstWhere(
            (m) => (m['id'] as num).toInt() == pmId,
            orElse: () => <String, dynamic>{},
          );
          if (manager.isNotEmpty) {
            _managerRecord = manager;
            final mUserId = manager['userId'];
            final mUser = users.firstWhere(
              (u) => u['id'] == mUserId,
              orElse: () => <String, dynamic>{},
            );
            if (mUser.isNotEmpty && mounted) {
              _managerUser = mUser;
            }
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
            'Şirket ve Yönetici Bilgileri',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Çalıştığınız şirkete ve yöneticinize ait bilgiler',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),

          if (_loading)
            const Center(child: CircularProgressIndicator(color: kBlue))
          else ...[
            // Manager Card
            if (_managerUser != null) ...[
              const Text(
                'Bağlı Yönetici',
                style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
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
                            color: const Color(0xFF10B981).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.person_rounded,
                            color: Color(0xFF10B981),
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_managerUser!['firstName'] ?? ''} ${_managerUser!['lastName'] ?? ''}'.trim(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                _managerRecord?['departmentName'] != null
                                    ? '${_managerRecord!['departmentName']} Departmanı'
                                    : 'Yönetici',
                                style: const TextStyle(color: kMuted, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _row(
                      'Telefon',
                      _managerUser!['phoneNumber']?.toString().isNotEmpty == true
                          ? _managerUser!['phoneNumber']
                          : '—',
                      Icons.phone_rounded,
                    ),
                    _row(
                      'E-posta',
                      _managerUser!['email']?.toString().isNotEmpty == true
                          ? _managerUser!['email']
                          : '—',
                      Icons.email_rounded,
                    ),
                    if (_managerRecord?['officeNumber'] != null)
                      _row(
                        'Ofis',
                        _managerRecord!['officeNumber'].toString(),
                        Icons.meeting_room_rounded,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: kCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kBorder),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: kMuted, size: 18),
                    SizedBox(width: 10),
                    Text(
                      'Henüz bir yöneticiye atanmadınız.',
                      style: TextStyle(color: kMuted, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Company Card
            const Text(
              'Şirket Bilgileri',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            if (_company == null)
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
            else
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
                                _company!['companyName'] ?? _company!['name'] ?? '—',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (_company!['sector'] != null)
                                Text(
                                  _company!['sector'],
                                  style: const TextStyle(color: kMuted, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _row('Vergi No', _company!['taxNumber'] ?? '—', Icons.numbers_rounded),
                    _row('Adres', _company!['address'] ?? '—', Icons.location_on_rounded),
                    _row('Telefon', _company!['phone'] ?? '—', Icons.phone_rounded),
                    _row('E-posta', _company!['email'] ?? '—', Icons.email_rounded),
                    _row('İletişim Kişisi', _company!['contactPerson'] ?? '—', Icons.person_rounded),
                    _row('Website', _company!['website'] ?? '—', Icons.language_rounded),
                    _row('Kuruluş Yılı', _company!['founded'] ?? '—', Icons.calendar_today_rounded),
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
