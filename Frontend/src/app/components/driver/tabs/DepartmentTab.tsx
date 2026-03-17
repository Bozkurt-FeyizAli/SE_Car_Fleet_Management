import React from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { departments, Department, getCompanyName, getUserName } from "../../../data/mockData";
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

export function DepartmentTab() {
  const driverDepts = departments.filter(dep => dep.company_id === currentDriver.company_id);

  const columns: Column<Department>[] = [
    { key: "name", header: "Departman Adi", render: (d) => d.name },
    { key: "company", header: "Sirket", render: (d) => getCompanyName(d.company_id) },
    { key: "manager", header: "Yonetici", render: (d) => getUserName(d.manager_id) },
    { key: "count", header: "Sofor Sayisi", render: (d) => d.driver_count },
  ];

  return (
    <div>
      <h2 className="mb-4">Departmanlar</h2>
      <DataTable data={driverDepts} columns={columns} searchPlaceholder="Departman ara..." searchKeys={["name"]} />
    </div>
  );
}
