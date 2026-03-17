import React from "react";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-700",
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${variantStyles[variant]}`}>
      {label}
    </span>
  );
}

export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "active": case "in_service": case "in_progress": case "on_trip":
    case "paid": case "picked_up": case "delivered": case "approved":
    case "good":
      return "success";
    case "suspended": case "inactive": case "out_of_service": case "off_duty":
    case "cancelled": case "major": case "poor": case "passive":
      return "danger";
    case "available": case "completed": case "resolved":
      return "neutral";
    case "pending": case "planned": case "assigned": case "unpaid":
    case "on_leave": case "rented": case "investigating": case "reported":
    case "fair": case "moderate": case "minor":
      return "warning";
    case "refunded":
      return "info";
    default:
      return "neutral";
  }
}

const statusLabels: Record<string, string> = {
  active: "Aktif", passive: "Pasif", suspended: "Askida",
  inactive: "Pasif", on_trip: "Seferde", off_duty: "Izinli", on_leave: "Izinli",
  available: "Musait", in_service: "Gorevde", out_of_service: "Devre Disi", rented: "Kirada",
  in_progress: "Devam Ediyor", completed: "Tamamlandi", assigned: "Atandi", planned: "Planlandi",
  pending: "Beklemede", picked_up: "Alindi", delivered: "Teslim Edildi", cancelled: "Iptal",
  paid: "Odendi", unpaid: "Odenmedi", refunded: "Iade Edildi",
  incoming: "Gelir", outgoing: "Gider",
  reported: "Bildirildi", investigating: "Inceleniyor", resolved: "Cozuldu",
  approved: "Onaylandi",
  minor: "Hafif", moderate: "Orta", major: "Agir",
  low: "Dusuk", medium: "Orta", high: "Yuksek",
  good: "Iyi", fair: "Orta", poor: "Kotu",
  system_admin: "Sistem Yoneticisi", company_admin: "Sirket Yoneticisi",
  department_admin: "Departman Yoneticisi", driver: "Sofor",
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] ?? status;
}
