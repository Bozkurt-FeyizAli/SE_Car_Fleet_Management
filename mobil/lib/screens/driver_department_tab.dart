import 'package:flutter/material.dart';
import 'shared_styles.dart';

// ══════════════════════════════════════════════════════════════════════════════
// Department Tab — matches web DepartmentTab.tsx (static)
// ══════════════════════════════════════════════════════════════════════════════
class DriverDepartmentTab extends StatelessWidget {
  const DriverDepartmentTab({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Departman',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Bağlı olduğunuz departman bilgileri',
            style: TextStyle(color: kMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              children: [
                _row('Departman Adı', '--', Icons.group_rounded),
                _row('Yönetici', '--', Icons.person_rounded),
                _row('Üye Sayısı', '--', Icons.people_rounded),
              ],
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _row(String label, String value, IconData icon) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(
      children: [
        Icon(icon, color: kMuted, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: kMuted, fontSize: 12),
          ),
        ),
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
  );
}
