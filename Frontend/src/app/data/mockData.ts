// ===================== TYPES (Combined from all 3 DB schemas) =====================

export interface Company {
  id: number;
  name: string;
  tax_number: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  status: "active" | "passive" | "suspended";
  manager_name?: string;
  manager_surname?: string;
  manager_tc?: string;
  manager_password?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  company_id: number | null;
  department_id: number | null;
  full_name: string;
  email: string;
  password_hash: string;
  role: "system_admin" | "company_admin" | "department_admin" | "driver";
  status: "active" | "inactive";
  phone?: string;
  last_login?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  company_id: number;
  manager_id: number;
  driver_count: number;
}

export interface DriverProfile {
  id: number;
  user_id: number;
  license_class: string;
  driver_score: number;
}

export interface Driver {
  id: number;
  company_id: number;
  user_id: number | null;
  department_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  identity_number: string;
  license_number: string;
  license_class: string;
  hire_date: string;
  current_score: number;
  status: "active" | "on_trip" | "off_duty" | "inactive" | "on_leave";
  email: string;
  password?: string;
  sicil_number?: string;
  vehicle_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DriverLicense {
  driver_id: number;
  license_type_id: number;
  license_code: string;
  expiry_date: string;
}

export interface Vehicle {
  id: number;
  company_id: number;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: "car" | "van" | "truck" | "motorcycle" | "lorry" | "sedan" | "light_commercial";
  capacity_kg: number;
  status: "available" | "in_service" | "out_of_service" | "active" | "passive" | "rented";
  insurance_start: string;
  insurance_expiry: string;
  inspection_start: string;
  inspection_expiry: string;
  casco_start: string;
  casco_expiry: string;
  next_maint_km: number;
  base_price: number;
  gps_data: string | null;
  current_driver_id: number | null;
  document_number: string;
  created_at: string;
  updated_at: string;
}

export interface InterCompanyRental {
  id: number;
  owner_comp_id: number;
  renter_comp_id: number;
  vehicle_id: number;
  driver_id: number | null;
  dynamic_price: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed" | "cancelled";
}

export interface Task {
  id: number;
  vehicle_id: number;
  driver_id: number;
  destination: string;
  start_km: number;
  end_km: number | null;
  status: "assigned" | "in_progress" | "completed";
  created_at: string;
}

export interface Trip {
  id: number;
  driver_id: number;
  vehicle_id: number;
  departure_location: string;
  arrival_location: string;
  start_time: string;
  end_time: string | null;
  distance_traveled: number | null;
  cargo: string;
  cargo_weight: string;
  status: "in_progress" | "completed" | "planned";
}

export interface Order {
  id: number;
  company_id: number;
  customer_name: string;
  driver_id: number | null;
  vehicle_id: number | null;
  order_number: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_time: string;
  status: "pending" | "assigned" | "picked_up" | "delivered" | "cancelled";
  price: number;
  payment_status: "unpaid" | "paid" | "refunded";
  notes: string;
  created_at: string;
}

export interface Payment {
  id: number;
  company_id: number;
  order_id: number | null;
  payment_type: "incoming" | "outgoing";
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  payment_date: string;
  description: string;
}

export interface CompanyDocument {
  id: number;
  company_id: number;
  document_type: string;
  file_path: string;
  upload_date: string;
  expiry_date: string | null;
  is_verified: boolean;
  notes: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action_type: string;
  description: string;
  created_at: string;
}

export interface DriverScore {
  id: number;
  driver_id: number;
  trip_id: number | null;
  score_value: number;
  comment: string;
  created_at: string;
}

export interface AccidentReport {
  id: number;
  driver_id: number;
  vehicle_id: number;
  description: string;
  location: string;
  date: string;
  severity: "minor" | "moderate" | "major";
  status: "reported" | "investigating" | "resolved";
  photos: string[];
  created_at: string;
}

export interface MaintenanceRequest {
  id: number;
  driver_id: number;
  vehicle_id: number;
  type: string;
  description: string;
  urgency: "low" | "medium" | "high";
  status: "pending" | "approved" | "in_progress" | "completed";
  created_at: string;
}

export interface DailyCheck {
  id: number;
  driver_id: number;
  vehicle_id: number;
  date: string;
  tire_condition: "good" | "fair" | "poor";
  brake_condition: "good" | "fair" | "poor";
  light_condition: "good" | "fair" | "poor";
  oil_level: "good" | "fair" | "poor";
  fuel_level: number;
  mileage: number;
  notes: string;
  created_at: string;
}

// ===================== MOCK DATA =====================

export let companies: Company[] = [
  { id: 1, name: "Anadolu Lojistik A.S.", tax_number: "1234567890", address: "Kadikoy, Istanbul", phone: "0212 555 1234", email: "info@anadolulojistik.com", website: "www.anadolulojistik.com", logo_url: "", status: "active", manager_name: "Ahmet", manager_surname: "Yilmaz", manager_tc: "11111111111", manager_password: "", created_at: "2015-03-12", updated_at: "2026-01-15" },
  { id: 2, name: "Karadeniz Tasımacilik Ltd.", tax_number: "9876543210", address: "Trabzon Merkez", phone: "0462 555 4321", email: "iletisim@karadeniztasima.com", website: "www.karadeniztasima.com", logo_url: "", status: "active", manager_name: "Mehmet", manager_surname: "Demir", manager_tc: "22222222222", manager_password: "", created_at: "2018-07-25", updated_at: "2026-02-10" },
  { id: 3, name: "Ege Kargo Hizmetleri", tax_number: "4567891230", address: "Alsancak, Izmir", phone: "0232 555 5678", email: "destek@egekargo.com", website: "www.egekargo.com", logo_url: "", status: "suspended", manager_name: "Ali", manager_surname: "Ozturk", manager_tc: "33333333333", manager_password: "", created_at: "2010-01-05", updated_at: "2025-11-20" },
  { id: 4, name: "Marmara Filo Yonetimi", tax_number: "7891234560", address: "Nilufer, Bursa", phone: "0224 555 9012", email: "info@marmarafilo.com", website: "www.marmarafilo.com", logo_url: "", status: "active", manager_name: "Zeynep", manager_surname: "Arslan", manager_tc: "44444444444", manager_password: "", created_at: "2020-11-18", updated_at: "2026-03-01" },
  { id: 5, name: "Ic Anadolu Nakliyat", tax_number: "3216549870", address: "Cankaya, Ankara", phone: "0312 555 3456", email: "bilgi@icanadolunakliyat.com", website: "www.icanadolunakliyat.com", logo_url: "", status: "active", manager_name: "Selin", manager_surname: "Koc", manager_tc: "55555555555", manager_password: "", created_at: "2012-06-30", updated_at: "2026-02-28" },
];

export let users: User[] = [
  { id: 1, company_id: null, department_id: null, full_name: "Super Admin", email: "admin@system.com", password_hash: "xxx", role: "system_admin", status: "active", phone: "0500 000 0001", created_at: "2015-01-01" },
  { id: 2, company_id: 1, department_id: null, full_name: "Ahmet Yilmaz", email: "ahmet@anadolulojistik.com", password_hash: "xxx", role: "company_admin", status: "active", phone: "0532 111 2233", last_login: "2026-03-03", created_at: "2015-03-15" },
  { id: 3, company_id: 1, department_id: 1, full_name: "Fatma Kaya", email: "fatma@anadolulojistik.com", password_hash: "xxx", role: "department_admin", status: "active", phone: "0533 222 3344", created_at: "2016-05-20" },
  { id: 4, company_id: 2, department_id: null, full_name: "Mehmet Demir", email: "mehmet@karadeniztasima.com", password_hash: "xxx", role: "company_admin", status: "active", phone: "0534 333 4455", created_at: "2018-08-01" },
  { id: 5, company_id: 2, department_id: 3, full_name: "Ayse Celik", email: "ayse@karadeniztasima.com", password_hash: "xxx", role: "department_admin", status: "inactive", phone: "0535 444 5566", created_at: "2019-02-15" },
  { id: 6, company_id: 3, department_id: null, full_name: "Ali Ozturk", email: "ali@egekargo.com", password_hash: "xxx", role: "company_admin", status: "active", phone: "0536 555 6677", created_at: "2010-02-01" },
  { id: 7, company_id: 4, department_id: null, full_name: "Zeynep Arslan", email: "zeynep@marmarafilo.com", password_hash: "xxx", role: "company_admin", status: "active", phone: "0537 666 7788", created_at: "2020-12-01" },
  { id: 8, company_id: 1, department_id: 2, full_name: "Emre Sahin", email: "emre@anadolulojistik.com", password_hash: "xxx", role: "department_admin", status: "active", phone: "0538 777 8899", created_at: "2017-09-10" },
  { id: 9, company_id: 5, department_id: null, full_name: "Selin Koc", email: "selin@icanadolunakliyat.com", password_hash: "xxx", role: "company_admin", status: "active", phone: "0539 888 9900", created_at: "2012-07-15" },
  // Driver users
  { id: 10, company_id: 1, department_id: 1, full_name: "Hasan Aydin", email: "hasan@anadolulojistik.com", password_hash: "xxx", role: "driver", status: "active", created_at: "2018-01-10" },
  { id: 11, company_id: 1, department_id: 2, full_name: "Ibrahim Yildiz", email: "ibrahim@anadolulojistik.com", password_hash: "xxx", role: "driver", status: "active", created_at: "2019-03-05" },
  { id: 12, company_id: 2, department_id: 3, full_name: "Mustafa Eren", email: "mustafa@karadeniztasima.com", password_hash: "xxx", role: "driver", status: "active", created_at: "2020-06-12" },
  { id: 13, company_id: 4, department_id: 5, full_name: "Kemal Aksoy", email: "kemal@marmarafilo.com", password_hash: "xxx", role: "driver", status: "active", created_at: "2021-01-20" },
];

export let departments: Department[] = [
  { id: 1, name: "Uzun Yol Tasimacılık", company_id: 1, manager_id: 3, driver_count: 12 },
  { id: 2, name: "Sehir Ici Dagitim", company_id: 1, manager_id: 8, driver_count: 8 },
  { id: 3, name: "Karadeniz Bolge", company_id: 2, manager_id: 5, driver_count: 6 },
  { id: 4, name: "Ege Operasyon", company_id: 3, manager_id: 6, driver_count: 4 },
  { id: 5, name: "Marmara Filo", company_id: 4, manager_id: 7, driver_count: 10 },
  { id: 6, name: "Ic Anadolu Operasyon", company_id: 5, manager_id: 9, driver_count: 7 },
];

export let drivers: Driver[] = [
  { id: 1, company_id: 1, user_id: 10, department_id: 1, first_name: "Hasan", last_name: "Aydin", phone: "0540 111 0001", identity_number: "12345678901", license_number: "LIC-001", license_class: "C", hire_date: "2018-01-10", current_score: 87.5, status: "on_trip", email: "hasan@anadolulojistik.com", password: "", sicil_number: "SIC-001", vehicle_id: 1, created_at: "2018-01-10", updated_at: "2026-03-01" },
  { id: 2, company_id: 1, user_id: 11, department_id: 2, first_name: "Ibrahim", last_name: "Yildiz", phone: "0540 111 0002", identity_number: "12345678902", license_number: "LIC-002", license_class: "C", hire_date: "2019-03-05", current_score: 92.0, status: "on_trip", email: "ibrahim@anadolulojistik.com", password: "", sicil_number: "SIC-002", vehicle_id: 2, created_at: "2019-03-05", updated_at: "2026-03-02" },
  { id: 3, company_id: 2, user_id: 12, department_id: 3, first_name: "Mustafa", last_name: "Eren", phone: "0540 222 0001", identity_number: "12345678903", license_number: "LIC-003", license_class: "E", hire_date: "2020-06-12", current_score: 78.0, status: "active", email: "mustafa@karadeniztasima.com", password: "", sicil_number: "SIC-003", vehicle_id: null, created_at: "2020-06-12", updated_at: "2026-02-15" },
  { id: 4, company_id: 2, user_id: null, department_id: 3, first_name: "Osman", last_name: "Gunes", phone: "0540 222 0002", identity_number: "12345678904", license_number: "LIC-004", license_class: "C", hire_date: "2021-01-15", current_score: 65.0, status: "off_duty", email: "osman@karadeniztasima.com", password: "", sicil_number: "SIC-004", vehicle_id: null, created_at: "2021-01-15", updated_at: "2026-01-20" },
  { id: 5, company_id: 4, user_id: 13, department_id: 5, first_name: "Kemal", last_name: "Aksoy", phone: "0540 333 0001", identity_number: "12345678905", license_number: "LIC-005", license_class: "D", hire_date: "2021-01-20", current_score: 95.0, status: "on_trip", email: "kemal@marmarafilo.com", password: "", sicil_number: "SIC-005", vehicle_id: 5, created_at: "2021-01-20", updated_at: "2026-03-01" },
  { id: 6, company_id: 5, user_id: null, department_id: 6, first_name: "Recep", last_name: "Polat", phone: "0540 444 0001", identity_number: "12345678906", license_number: "LIC-006", license_class: "C", hire_date: "2020-08-10", current_score: 80.0, status: "active", email: "recep@icanadolunakliyat.com", password: "", sicil_number: "SIC-006", vehicle_id: null, created_at: "2020-08-10", updated_at: "2026-02-28" },
  { id: 7, company_id: 1, user_id: null, department_id: 1, first_name: "Serkan", last_name: "Turan", phone: "0540 111 0003", identity_number: "12345678907", license_number: "LIC-007", license_class: "E", hire_date: "2022-04-01", current_score: 88.5, status: "on_trip", email: "serkan@anadolulojistik.com", password: "", sicil_number: "SIC-007", vehicle_id: 7, created_at: "2022-04-01", updated_at: "2026-02-28" },
  { id: 8, company_id: 3, user_id: null, department_id: 4, first_name: "Yusuf", last_name: "Cetin", phone: "0540 555 0001", identity_number: "12345678908", license_number: "LIC-008", license_class: "B", hire_date: "2019-11-20", current_score: 72.0, status: "off_duty", email: "yusuf@egekargo.com", password: "", sicil_number: "SIC-008", vehicle_id: null, created_at: "2019-11-20", updated_at: "2025-11-20" },
];

export let driverLicenses: DriverLicense[] = [
  { driver_id: 1, license_type_id: 3, license_code: "C", expiry_date: "2027-05-15" },
  { driver_id: 2, license_type_id: 3, license_code: "C", expiry_date: "2026-11-20" },
  { driver_id: 3, license_type_id: 5, license_code: "E", expiry_date: "2026-08-10" },
  { driver_id: 4, license_type_id: 3, license_code: "C", expiry_date: "2027-02-28" },
  { driver_id: 5, license_type_id: 4, license_code: "D", expiry_date: "2026-06-01" },
  { driver_id: 6, license_type_id: 3, license_code: "C", expiry_date: "2028-01-15" },
  { driver_id: 7, license_type_id: 5, license_code: "E", expiry_date: "2027-09-22" },
  { driver_id: 8, license_type_id: 2, license_code: "B", expiry_date: "2026-12-30" },
];

export let vehicles: Vehicle[] = [
  { id: 1, company_id: 1, plate_number: "34 ABC 123", brand: "Mercedes-Benz", model: "Actros", year: 2022, vehicle_type: "truck", capacity_kg: 25000, status: "in_service", insurance_start: "2025-06-30", insurance_expiry: "2026-06-30", inspection_start: "2025-12-31", inspection_expiry: "2026-12-31", casco_start: "2025-12-31", casco_expiry: "2026-12-31", next_maint_km: 150000, base_price: 3200, gps_data: "41.0082,28.9784", current_driver_id: 1, document_number: "DOC-2024-001", created_at: "2022-01-15", updated_at: "2026-03-01" },
  { id: 2, company_id: 1, plate_number: "34 DEF 456", brand: "Volvo", model: "FH16", year: 2021, vehicle_type: "truck", capacity_kg: 30000, status: "in_service", insurance_start: "2025-03-15", insurance_expiry: "2026-03-15", inspection_start: "2025-09-15", inspection_expiry: "2026-09-15", casco_start: "2025-09-15", casco_expiry: "2026-09-15", next_maint_km: 120000, base_price: 3500, gps_data: "38.4192,27.1287", current_driver_id: 2, document_number: "DOC-2024-002", created_at: "2021-06-20", updated_at: "2026-03-02" },
  { id: 3, company_id: 2, plate_number: "61 GHI 789", brand: "Scania", model: "R500", year: 2023, vehicle_type: "truck", capacity_kg: 28000, status: "available", insurance_start: "2025-07-20", insurance_expiry: "2026-07-20", inspection_start: "2026-01-20", inspection_expiry: "2027-01-20", casco_start: "2026-01-20", casco_expiry: "2027-01-20", next_maint_km: 80000, base_price: 2800, gps_data: "41.0027,39.7168", current_driver_id: null, document_number: "DOC-2024-003", created_at: "2023-03-10", updated_at: "2026-02-15" },
  { id: 4, company_id: 2, plate_number: "61 JKL 012", brand: "MAN", model: "TGX", year: 2020, vehicle_type: "truck", capacity_kg: 24000, status: "out_of_service", insurance_start: "2024-11-10", insurance_expiry: "2025-11-10", inspection_start: "2025-05-10", inspection_expiry: "2026-05-10", casco_start: "2025-05-10", casco_expiry: "2026-05-10", next_maint_km: 200000, base_price: 2500, gps_data: null, current_driver_id: null, document_number: "DOC-2024-004", created_at: "2020-09-05", updated_at: "2026-01-20" },
  { id: 5, company_id: 4, plate_number: "34 MNO 345", brand: "DAF", model: "XF", year: 2023, vehicle_type: "truck", capacity_kg: 26000, status: "in_service", insurance_start: "2025-09-25", insurance_expiry: "2026-09-25", inspection_start: "2026-03-25", inspection_expiry: "2027-03-25", casco_start: "2026-03-25", casco_expiry: "2027-03-25", next_maint_km: 60000, base_price: 3000, gps_data: "40.1885,29.0610", current_driver_id: 5, document_number: "DOC-2024-005", created_at: "2023-05-15", updated_at: "2026-03-01" },
  { id: 6, company_id: 5, plate_number: "06 PRS 678", brand: "Iveco", model: "S-Way", year: 2022, vehicle_type: "truck", capacity_kg: 22000, status: "available", insurance_start: "2025-02-05", insurance_expiry: "2026-02-05", inspection_start: "2025-08-05", inspection_expiry: "2026-08-05", casco_start: "2025-08-05", casco_expiry: "2026-08-05", next_maint_km: 100000, base_price: 2600, gps_data: "39.9334,32.8597", current_driver_id: null, document_number: "DOC-2024-006", created_at: "2022-07-20", updated_at: "2026-02-28" },
  { id: 7, company_id: 1, plate_number: "34 STU 901", brand: "Mercedes-Benz", model: "Arocs", year: 2024, vehicle_type: "lorry", capacity_kg: 32000, status: "in_service", insurance_start: "2025-12-18", insurance_expiry: "2026-12-18", inspection_start: "2026-06-18", inspection_expiry: "2027-06-18", casco_start: "2026-06-18", casco_expiry: "2027-06-18", next_maint_km: 30000, base_price: 4000, gps_data: "41.0082,28.9784", current_driver_id: 7, document_number: "DOC-2024-007", created_at: "2024-01-10", updated_at: "2026-02-28" },
  { id: 8, company_id: 3, plate_number: "35 VYZ 234", brand: "Renault", model: "T High", year: 2019, vehicle_type: "truck", capacity_kg: 20000, status: "out_of_service", insurance_start: "2024-10-12", insurance_expiry: "2025-10-12", inspection_start: "2025-04-12", inspection_expiry: "2026-04-12", casco_start: "2025-04-12", casco_expiry: "2026-04-12", next_maint_km: 250000, base_price: 2000, gps_data: null, current_driver_id: null, document_number: "DOC-2024-008", created_at: "2019-11-25", updated_at: "2025-11-20" },
];

export let interCompanyRentals: InterCompanyRental[] = [
  { id: 1, owner_comp_id: 2, renter_comp_id: 1, vehicle_id: 3, driver_id: 1, dynamic_price: 2500, start_date: "2026-01-15", end_date: "2026-04-15", status: "active" },
  { id: 2, owner_comp_id: 5, renter_comp_id: 4, vehicle_id: 6, driver_id: 5, dynamic_price: 3000, start_date: "2025-11-01", end_date: "2026-02-28", status: "completed" },
  { id: 3, owner_comp_id: 4, renter_comp_id: 2, vehicle_id: 5, driver_id: 3, dynamic_price: 2800, start_date: "2026-02-01", end_date: "2026-05-01", status: "active" },
  { id: 4, owner_comp_id: 1, renter_comp_id: 5, vehicle_id: 1, driver_id: null, dynamic_price: 3200, start_date: "2025-09-10", end_date: "2025-12-10", status: "completed" },
  { id: 5, owner_comp_id: 1, renter_comp_id: 3, vehicle_id: 7, driver_id: null, dynamic_price: 3500, start_date: "2026-03-01", end_date: "2026-06-01", status: "active" },
];

export let tasks: Task[] = [
  { id: 1, vehicle_id: 1, driver_id: 1, destination: "Istanbul - Ankara", start_km: 125000, end_km: null, status: "in_progress", created_at: "2026-03-01" },
  { id: 2, vehicle_id: 2, driver_id: 2, destination: "Istanbul - Izmir", start_km: 98000, end_km: null, status: "in_progress", created_at: "2026-03-02" },
  { id: 3, vehicle_id: 5, driver_id: 5, destination: "Bursa - Antalya", start_km: 45000, end_km: null, status: "in_progress", created_at: "2026-03-01" },
  { id: 4, vehicle_id: 7, driver_id: 7, destination: "Istanbul - Trabzon", start_km: 22000, end_km: null, status: "in_progress", created_at: "2026-02-28" },
  { id: 5, vehicle_id: 1, driver_id: 1, destination: "Ankara - Konya", start_km: 120000, end_km: 120260, status: "completed", created_at: "2026-02-20" },
];

export let trips: Trip[] = [
  { id: 1, driver_id: 1, vehicle_id: 1, departure_location: "Istanbul", arrival_location: "Ankara", start_time: "2026-03-01T08:00:00", end_time: null, distance_traveled: null, cargo: "Elektronik Esya", cargo_weight: "12 Ton", status: "in_progress" },
  { id: 2, driver_id: 2, vehicle_id: 2, departure_location: "Istanbul", arrival_location: "Izmir", start_time: "2026-03-02T06:30:00", end_time: null, distance_traveled: null, cargo: "Gida Urunleri", cargo_weight: "8 Ton", status: "in_progress" },
  { id: 3, driver_id: 5, vehicle_id: 5, departure_location: "Bursa", arrival_location: "Antalya", start_time: "2026-03-01T07:00:00", end_time: null, distance_traveled: null, cargo: "Tekstil", cargo_weight: "15 Ton", status: "in_progress" },
  { id: 4, driver_id: 7, vehicle_id: 7, departure_location: "Istanbul", arrival_location: "Trabzon", start_time: "2026-02-28T05:00:00", end_time: null, distance_traveled: null, cargo: "Insaat Malzemesi", cargo_weight: "20 Ton", status: "in_progress" },
  { id: 5, driver_id: 1, vehicle_id: 1, departure_location: "Ankara", arrival_location: "Konya", start_time: "2026-02-20T09:00:00", end_time: "2026-02-21T14:00:00", distance_traveled: 260, cargo: "Mobilya", cargo_weight: "10 Ton", status: "completed" },
  { id: 6, driver_id: 3, vehicle_id: 3, departure_location: "Trabzon", arrival_location: "Erzurum", start_time: "2026-02-15T08:00:00", end_time: "2026-02-16T12:00:00", distance_traveled: 310, cargo: "Tarim Urunleri", cargo_weight: "18 Ton", status: "completed" },
  { id: 7, driver_id: 5, vehicle_id: 5, departure_location: "Antalya", arrival_location: "Mersin", start_time: "2026-03-10T07:00:00", end_time: null, distance_traveled: null, cargo: "Kimyasal Madde", cargo_weight: "14 Ton", status: "planned" },
];

export let orders: Order[] = [
  { id: 1, company_id: 1, customer_name: "ABC Ticaret", driver_id: 1, vehicle_id: 1, order_number: "ORD-2026-001", pickup_address: "Kadikoy, Istanbul", delivery_address: "Kizilay, Ankara", scheduled_time: "2026-03-01T08:00:00", status: "picked_up", price: 15000, payment_status: "paid", notes: "Kirilacak esya", created_at: "2026-02-28" },
  { id: 2, company_id: 1, customer_name: "XYZ Market", driver_id: 2, vehicle_id: 2, order_number: "ORD-2026-002", pickup_address: "Umraniye, Istanbul", delivery_address: "Bornova, Izmir", scheduled_time: "2026-03-02T06:30:00", status: "picked_up", price: 12000, payment_status: "unpaid", notes: "Soguk zincir", created_at: "2026-03-01" },
  { id: 3, company_id: 1, customer_name: "DEF Insaat", driver_id: null, vehicle_id: null, order_number: "ORD-2026-003", pickup_address: "Tuzla, Istanbul", delivery_address: "Osmangazi, Bursa", scheduled_time: "2026-03-05T09:00:00", status: "pending", price: 8000, payment_status: "unpaid", notes: "", created_at: "2026-03-02" },
  { id: 4, company_id: 2, customer_name: "GHI Gida", driver_id: 3, vehicle_id: 3, order_number: "ORD-2026-004", pickup_address: "Trabzon Merkez", delivery_address: "Erzurum Merkez", scheduled_time: "2026-02-15T08:00:00", status: "delivered", price: 9500, payment_status: "paid", notes: "Taze urunler", created_at: "2026-02-14" },
  { id: 5, company_id: 4, customer_name: "JKL Tekstil", driver_id: 5, vehicle_id: 5, order_number: "ORD-2026-005", pickup_address: "Nilufer, Bursa", delivery_address: "Muratpasa, Antalya", scheduled_time: "2026-03-01T07:00:00", status: "picked_up", price: 18000, payment_status: "paid", notes: "Tekstil urunleri", created_at: "2026-02-28" },
];

export let payments: Payment[] = [
  { id: 1, company_id: 1, order_id: 1, payment_type: "incoming", amount: 15000, currency: "TRY", payment_method: "Havale", transaction_id: "TRX-001", payment_date: "2026-02-28", description: "ORD-2026-001 odemesi" },
  { id: 2, company_id: 1, order_id: null, payment_type: "outgoing", amount: 8500, currency: "TRY", payment_method: "Havale", transaction_id: "TRX-002", payment_date: "2026-03-01", description: "Sofor maas odemesi - Mart" },
  { id: 3, company_id: 2, order_id: 4, payment_type: "incoming", amount: 9500, currency: "TRY", payment_method: "Kredi Karti", transaction_id: "TRX-003", payment_date: "2026-02-16", description: "ORD-2026-004 odemesi" },
  { id: 4, company_id: 4, order_id: 5, payment_type: "incoming", amount: 18000, currency: "TRY", payment_method: "Havale", transaction_id: "TRX-004", payment_date: "2026-02-28", description: "ORD-2026-005 odemesi" },
  { id: 5, company_id: 1, order_id: null, payment_type: "outgoing", amount: 5200, currency: "TRY", payment_method: "Nakit", transaction_id: "TRX-005", payment_date: "2026-02-25", description: "Arac bakim gideri - 34 ABC 123" },
];

export let companyDocuments: CompanyDocument[] = [
  { id: 1, company_id: 1, document_type: "Vergi Levhasi", file_path: "/docs/vergi_levhasi_1.pdf", upload_date: "2025-01-15", expiry_date: null, is_verified: true, notes: "" },
  { id: 2, company_id: 1, document_type: "Ticaret Sicil Gazetesi", file_path: "/docs/ticaret_sicil_1.pdf", upload_date: "2025-01-15", expiry_date: null, is_verified: true, notes: "" },
  { id: 3, company_id: 1, document_type: "Tasima Yetki Belgesi", file_path: "/docs/tasima_yetki_1.pdf", upload_date: "2025-06-01", expiry_date: "2026-06-01", is_verified: true, notes: "Yenilenmesi gerekiyor" },
  { id: 4, company_id: 2, document_type: "Vergi Levhasi", file_path: "/docs/vergi_levhasi_2.pdf", upload_date: "2025-03-10", expiry_date: null, is_verified: true, notes: "" },
  { id: 5, company_id: 2, document_type: "Sigorta Policesi", file_path: "/docs/sigorta_2.pdf", upload_date: "2025-09-01", expiry_date: "2026-09-01", is_verified: false, notes: "Onay bekliyor" },
];

export let auditLogs: AuditLog[] = [
  { id: 1, user_id: 1, action_type: "company_created", description: "Marmara Filo Yonetimi sirketi sisteme eklendi", created_at: "2020-11-18T10:00:00" },
  { id: 2, user_id: 2, action_type: "driver_added", description: "Hasan Aydin sofor olarak eklendi", created_at: "2018-01-10T09:00:00" },
  { id: 3, user_id: 1, action_type: "company_suspended", description: "Ege Kargo Hizmetleri askiya alindi", created_at: "2025-11-20T14:30:00" },
  { id: 4, user_id: null, action_type: "trip_completed", description: "Sefer #5 tamamlandi: Ankara - Konya", created_at: "2026-02-21T14:00:00" },
  { id: 5, user_id: null, action_type: "score_change", description: "Sofor Hasan Aydin puani 87.5 olarak guncellendi", created_at: "2026-02-21T14:05:00" },
  { id: 6, user_id: 2, action_type: "vehicle_added", description: "34 STU 901 plakali arac eklendi", created_at: "2024-01-10T11:00:00" },
  { id: 7, user_id: 1, action_type: "rental_created", description: "Sirketler arasi kiralama #1 olusturuldu", created_at: "2026-01-15T09:00:00" },
  { id: 8, user_id: null, action_type: "accident", description: "61 JKL 012 plakali aracta kaza bildirildi", created_at: "2026-01-18T16:45:00" },
];

export let driverScores: DriverScore[] = [
  { id: 1, driver_id: 1, trip_id: 5, score_value: 90, comment: "Zamaninda teslim, temiz suruculuk", created_at: "2026-02-21T14:05:00" },
  { id: 2, driver_id: 3, trip_id: 6, score_value: 75, comment: "Gecikme yasandi", created_at: "2026-02-16T12:10:00" },
  { id: 3, driver_id: 2, trip_id: null, score_value: 95, comment: "Mukemmel performans", created_at: "2026-02-25T10:00:00" },
  { id: 4, driver_id: 5, trip_id: null, score_value: 98, comment: "En iyi sofor odulu", created_at: "2026-03-01T08:00:00" },
];

export let accidentReports: AccidentReport[] = [
  { id: 1, driver_id: 4, vehicle_id: 4, description: "Kavsakta diger aracla carpma", location: "Trabzon - Of yolu", date: "2026-01-18", severity: "moderate", status: "resolved", photos: [], created_at: "2026-01-18T16:45:00" },
  { id: 2, driver_id: 8, vehicle_id: 8, description: "Yol kenarindaki bariyerlere carpma", location: "Izmir - Aydin otoyolu", date: "2025-11-15", severity: "major", status: "resolved", photos: [], created_at: "2025-11-15T22:30:00" },
];

export let maintenanceRequests: MaintenanceRequest[] = [
  { id: 1, driver_id: 1, vehicle_id: 1, type: "Periyodik Bakim", description: "150.000 km periyodik bakim yaklasiyor", urgency: "medium", status: "approved", created_at: "2026-02-25" },
  { id: 2, driver_id: 3, vehicle_id: 3, type: "Lastik Degisimi", description: "On lastikler asinmis durumda", urgency: "high", status: "pending", created_at: "2026-03-01" },
  { id: 3, driver_id: 5, vehicle_id: 5, type: "Fren Bakimi", description: "Fren balatalarinda asınma", urgency: "high", status: "in_progress", created_at: "2026-02-28" },
];

export let dailyChecks: DailyCheck[] = [
  { id: 1, driver_id: 1, vehicle_id: 1, date: "2026-03-03", tire_condition: "good", brake_condition: "good", light_condition: "good", oil_level: "good", fuel_level: 85, mileage: 125450, notes: "Her sey normal", created_at: "2026-03-03T06:30:00" },
  { id: 2, driver_id: 1, vehicle_id: 1, date: "2026-03-02", tire_condition: "good", brake_condition: "fair", light_condition: "good", oil_level: "good", fuel_level: 60, mileage: 125200, notes: "Fren biraz yumusak", created_at: "2026-03-02T06:45:00" },
  { id: 3, driver_id: 2, vehicle_id: 2, date: "2026-03-03", tire_condition: "fair", brake_condition: "good", light_condition: "good", oil_level: "fair", fuel_level: 70, mileage: 98500, notes: "Lastikler kontrol edilmeli", created_at: "2026-03-03T06:00:00" },
];

// ===================== HELPER FUNCTIONS =====================

export function getCompanyName(id: number | null): string {
  if (!id) return "—";
  return companies.find(c => c.id === id)?.name ?? "—";
}

export function getDriverFullName(id: number | null): string {
  if (!id) return "—";
  const d = drivers.find(dr => dr.id === id);
  return d ? `${d.first_name} ${d.last_name}` : "—";
}

export function getUserName(id: number | null): string {
  if (!id) return "Sistem";
  return users.find(u => u.id === id)?.full_name ?? "—";
}

export function getVehiclePlate(id: number | null): string {
  if (!id) return "—";
  return vehicles.find(v => v.id === id)?.plate_number ?? "—";
}

export function getDepartmentName(id: number | null): string {
  if (!id) return "—";
  return departments.find(d => d.id === id)?.name ?? "—";
}

// ID generators
let _nextId = 1000;
export function nextId(): number {
  return ++_nextId;
}
