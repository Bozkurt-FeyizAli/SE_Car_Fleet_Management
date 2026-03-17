import React from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { trips, Trip, getVehiclePlate } from "../../../data/mockData";
const currentDriver = {
  id: 1,
  name: "Ahmet Yilmaz",
  tc: "12345678901",
  phone: "555 123 4567",
  email: "ahmet@mail.com",
  license_type: "E",
  company_id: 101, 
  department_id: 201, 
  points: 100,
  status: "active" as const
};

export function TripsTab() {
  const driverTrips = trips.filter(t => t.driver_id === currentDriver.id);

  const columns: Column<Trip>[] = [
    { key: "from", header: "Cikis", render: (t) => t.departure_location },
    { key: "to", header: "Hedef", render: (t) => t.arrival_location },
    { key: "cargo", header: "Yuk", render: (t) => t.cargo },
    { key: "weight", header: "Agirlik", render: (t) => t.cargo_weight },
    { key: "vehicle", header: "Arac", render: (t) => getVehiclePlate(t.vehicle_id) },
    { key: "distance", header: "Mesafe", render: (t) => t.distance_traveled ? `${t.distance_traveled} km` : "—" },
    { key: "start", header: "Baslangic", render: (t) => new Date(t.start_time).toLocaleString("tr-TR") },
    { key: "end", header: "Bitis", render: (t) => t.end_time ? new Date(t.end_time).toLocaleString("tr-TR") : "—" },
    { key: "status", header: "Durum", render: (t) => <StatusBadge label={getStatusLabel(t.status)} variant={getStatusVariant(t.status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-4">Seferlerim</h2>
      <DataTable data={driverTrips} columns={columns} searchPlaceholder="Sefer ara..." searchKeys={["departure_location", "arrival_location", "cargo"]} />
    </div>
  );
}
