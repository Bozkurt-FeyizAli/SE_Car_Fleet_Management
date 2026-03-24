import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { auditLogs, AuditLog, getUserName } from "../../../data/mockData";

export function AuditLogsTab() {
  const [data] = useState([...auditLogs].reverse());

  const getLogVariant = (type: string) => {
    if (type.includes("accident")) return "danger" as const;
    if (type.includes("completed")) return "success" as const;
    if (type.includes("created") || type.includes("added")) return "info" as const;
    if (type.includes("suspended")) return "warning" as const;
    return "neutral" as const;
  };

  const columns: Column<AuditLog>[] = [
    { key: "id", header: "ID", render: (l) => `#${l.id}` },
    { key: "date", header: "Tarih", render: (l) => new Date(l.created_at).toLocaleString("tr-TR") },
    { key: "type", header: "Islem Tipi", render: (l) => <StatusBadge label={l.action_type.replace(/_/g, " ")} variant={getLogVariant(l.action_type)} /> },
    { key: "desc", header: "Aciklama", render: (l) => <span className="max-w-xs truncate block">{l.description}</span> },
    { key: "user", header: "Kullanici", render: (l) => getUserName(l.user_id) },
  ];

  return (
    <div>
      <h2 className="mb-4">Denetim Kayitlari</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Kayit ara..." searchKeys={["action_type", "description"]} />
    </div>
  );
}
