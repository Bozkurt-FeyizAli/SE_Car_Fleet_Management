import 'package:flutter/material.dart';

// ─── Color constants ──────────────────────────────────────────────────────
const Color kBg = Color(0xFF020617);
const Color kCard = Color(0xFF0F172A);
const Color kBorder = Color(0xFF1E293B);
const Color kFill = Color(0xFF1E293B);
const Color kMuted = Color(0xFF94A3B8);
const Color kBlue = Color(0xFF2563EB);
const Color kGreen = Color(0xFF059669);
const Color kRed = Color(0xFFDC2626);

// ─── Shared input decoration ──────────────────────────────────────────────
InputDecoration fieldDecor(String label) => InputDecoration(
  labelText: label,
  labelStyle: const TextStyle(color: kMuted, fontSize: 13),
  filled: true,
  fillColor: kFill,
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
  enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(color: kBorder),
    borderRadius: BorderRadius.circular(8),
  ),
  focusedBorder: OutlineInputBorder(
    borderSide: const BorderSide(color: kBlue),
    borderRadius: BorderRadius.circular(8),
  ),
);

// ─── Shared form text field ───────────────────────────────────────────────
Widget kField(
  String label,
  TextEditingController c, {
  TextInputType? type,
  bool obscure = false,
  String? hint,
  bool enabled = true,
}) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: TextField(
      controller: c,
      keyboardType: type,
      obscureText: obscure,
      enabled: enabled,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: fieldDecor(label).copyWith(
        hintText: hint,
        hintStyle: const TextStyle(color: kMuted, fontSize: 13),
      ),
    ),
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────
Color kStatusColor(String? s) {
  switch (s) {
    case 'active':
      return Colors.green;
    case 'Idle':
      return Colors.green;
    case 'suspended':
      return Colors.orange;
    case 'Preparing':
    case 'preparing':
      return Colors.orange;
    case 'InTrip':
    case 'on_trip':
      return const Color(0xFF60A5FA);
    case 'off_duty':
      return const Color(0xFFA78BFA);
    default:
      return Colors.grey;
  }
}

String kStatusLabel(String? s) {
  switch (s) {
    case 'active':
      return 'Aktif';
    case 'Idle':
      return 'Müsait';
    case 'suspended':
      return 'Askıda';
    case 'passive':
    case 'inactive':
      return 'Pasif';
    case 'Preparing':
    case 'preparing':
      return 'Hazırlanıyor';
    case 'InTrip':
    case 'on_trip':
      return 'Seferde';
    case 'off_duty':
      return 'İzinli';
    case 'completed':
    case 'Completed':
      return 'Tamamlandı';
    case 'cancelled':
    case 'Cancelled':
      return 'İptal';
    default:
      return s ?? '—';
  }
}

Widget kBadge(String label, Color color) => Container(
  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
  decoration: BoxDecoration(
    color: color.withValues(alpha: 0.15),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Text(
    label,
    style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500),
  ),
);

// ─── Snackbar helpers ─────────────────────────────────────────────────────
void kSuccess(BuildContext ctx, String msg) {
  if (!ctx.mounted) return;
  ScaffoldMessenger.of(
    ctx,
  ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));
}

void kError(BuildContext ctx, String msg) {
  if (!ctx.mounted) return;
  ScaffoldMessenger.of(
    ctx,
  ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
}

// ─── Confirm dialog ───────────────────────────────────────────────────────
Future<bool?> kConfirm(BuildContext ctx, String title, String msg) =>
    showDialog<bool>(
      context: ctx,
      builder: (c) => AlertDialog(
        backgroundColor: kCard,
        title: Text(title, style: const TextStyle(color: Colors.white)),
        content: Text(msg, style: const TextStyle(color: kMuted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('İptal', style: TextStyle(color: kMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Sil', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

// ─── Search InputDecoration ───────────────────────────────────────────────
InputDecoration kInputDec(String hint) => InputDecoration(
  hintText: hint,
  hintStyle: const TextStyle(color: kMuted, fontSize: 13),
  filled: true,
  fillColor: kFill,
  isDense: true,
  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
  enabledBorder: OutlineInputBorder(
    borderSide: const BorderSide(color: kBorder),
    borderRadius: BorderRadius.circular(8),
  ),
  focusedBorder: OutlineInputBorder(
    borderSide: const BorderSide(color: kBlue),
    borderRadius: BorderRadius.circular(8),
  ),
);

// ─── Form label ───────────────────────────────────────────────────────────
Widget kLabel(String text) => Padding(
  padding: const EdgeInsets.only(bottom: 6),
  child: Text(text, style: const TextStyle(color: kMuted, fontSize: 13)),
);

// ─── Dropdown field ───────────────────────────────────────────────────────
Widget kDropdown(
  String value,
  List<String> values,
  List<String> labels,
  ValueChanged<String?> onChanged,
) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: DropdownButtonFormField<String>(
      initialValue: value,
      dropdownColor: kCard,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        filled: true,
        fillColor: kFill,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: kBorder),
          borderRadius: BorderRadius.circular(8),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(color: kBlue),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      items: List.generate(
        values.length,
        (i) => DropdownMenuItem(value: values[i], child: Text(labels[i])),
      ),
      onChanged: onChanged,
    ),
  );
}

// ─── TextField with hint ──────────────────────────────────────────────────
Widget kFieldHint(
  String label,
  TextEditingController c, {
  TextInputType? type,
  bool obscure = false,
  String? hint,
}) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: TextField(
      controller: c,
      keyboardType: type,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: fieldDecor(label).copyWith(
        hintText: hint,
        hintStyle: const TextStyle(color: kMuted, fontSize: 13),
      ),
    ),
  );
}

// ─── List card action row ─────────────────────────────────────────────────
Widget kActions(VoidCallback onEdit, VoidCallback onDelete) => Row(
  mainAxisAlignment: MainAxisAlignment.end,
  children: [
    TextButton.icon(
      onPressed: onEdit,
      icon: const Icon(Icons.edit_outlined, size: 15, color: kBlue),
      label: const Text(
        'Düzenle',
        style: TextStyle(color: kBlue, fontSize: 12),
      ),
      style: TextButton.styleFrom(
        minimumSize: Size.zero,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
    ),
    const SizedBox(width: 4),
    TextButton.icon(
      onPressed: onDelete,
      icon: const Icon(Icons.delete_outline, size: 15, color: Colors.red),
      label: const Text(
        'Sil',
        style: TextStyle(color: Colors.red, fontSize: 12),
      ),
      style: TextButton.styleFrom(
        minimumSize: Size.zero,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
    ),
  ],
);
