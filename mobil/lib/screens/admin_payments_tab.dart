import 'package:flutter/material.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Payments & Orders Tab (Mock Data)
// Restricted to managers with Permission ID 2 (Ödeme İşlemleri)
// ══════════════════════════════════════════════════════════════════════════════

class AdminPaymentsTab extends StatefulWidget {
  const AdminPaymentsTab({super.key});

  @override
  State<AdminPaymentsTab> createState() => _AdminPaymentsTabState();
}

class _AdminPaymentsTabState extends State<AdminPaymentsTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _mockPayments = [
    {
      'id': 'PAY-10492',
      'date': '2024-05-01 14:30',
      'amount': '12,500 ₺',
      'status': 'Başarılı',
      'description': 'Nisan Ayı Kiralama Bedeli',
      'company': 'Anadolu Lojistik A.Ş',
    },
    {
      'id': 'PAY-10493',
      'date': '2024-05-03 09:15',
      'amount': '8,250 ₺',
      'status': 'Beklemede',
      'description': 'Araç Bakım Faturası',
      'company': 'Borusan Otomotiv',
    },
    {
      'id': 'PAY-10494',
      'date': '2024-05-04 11:45',
      'amount': '3,400 ₺',
      'status': 'Başarılı',
      'description': 'Yedek Parça Alımı',
      'company': 'Oto Parça A.Ş',
    },
    {
      'id': 'PAY-10495',
      'date': '2024-05-05 16:20',
      'amount': '45,000 ₺',
      'status': 'Başarısız',
      'description': 'Toplu Yakıt Ödemesi',
      'company': 'Petrol Ofisi',
    },
  ];

  final List<Map<String, dynamic>> _mockOrders = [
    {
      'id': 'ORD-5012',
      'date': '2024-05-02 10:00',
      'amount': '120,000 ₺',
      'status': 'Hazırlanıyor',
      'description': '3 Adet Yeni Kasa Tır',
      'company': 'Mercedes-Benz Türk',
    },
    {
      'id': 'ORD-5013',
      'date': '2024-05-04 14:20',
      'amount': '15,000 ₺',
      'status': 'Tamamlandı',
      'description': 'Ofis Mobilyaları',
      'company': 'IKEA Kurumsal',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Başarılı':
      case 'Tamamlandı':
        return kGreen;
      case 'Beklemede':
      case 'Hazırlanıyor':
        return Colors.orange;
      case 'Başarısız':
        return Colors.redAccent;
      default:
        return kMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: kCard,
          child: TabBar(
            controller: _tabController,
            indicatorColor: kBlue,
            labelColor: kBlue,
            unselectedLabelColor: kMuted,
            tabs: const [
              Tab(text: 'Ödemeler'),
              Tab(text: 'Siparişler'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildList(_mockPayments, isOrder: false),
              _buildList(_mockOrders, isOrder: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildList(List<Map<String, dynamic>> items, {required bool isOrder}) {
    if (items.isEmpty) {
      return Center(
        child: Text(
          isOrder ? 'Kayıtlı sipariş bulunamadı.' : 'Kayıtlı ödeme bulunamadı.',
          style: const TextStyle(color: kMuted),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(14),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final statusColor = _statusColor(item['status']);
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item['id'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  kBadge(item['status'], statusColor),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['description'],
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item['company'],
                          style: const TextStyle(color: kMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        item['amount'],
                        style: const TextStyle(
                          color: kBlue,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item['date'],
                        style: const TextStyle(color: kMuted, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
