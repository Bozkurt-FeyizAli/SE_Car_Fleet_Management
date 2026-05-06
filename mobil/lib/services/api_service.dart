import 'dart:convert';
import 'package:http/http.dart' as http;
import 'token_storage_service.dart';

/// Generic REST API service with JWT authentication.
/// All CRUD operations for Company, User, Vehicle, etc.
class ApiService {
  static const String baseUrl = 'http://mikbalceyhan.me';
  final TokenStorageService _tokenStorage;

  ApiService({TokenStorageService? tokenStorage})
    : _tokenStorage = tokenStorage ?? TokenStorageService();

  Future<Map<String, String>> _authHeaders() async {
    final token = await _tokenStorage.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Generic GET ────────────────────────────────────────────────────────────
  Future<dynamic> get(String path) async {
    final headers = await _authHeaders();
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: headers);
    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception('GET $path failed: ${res.statusCode}');
  }

  // ── Generic POST ───────────────────────────────────────────────────────────
  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    throw Exception('POST $path failed: ${res.statusCode} — ${res.body}');
  }

  Future<dynamic> postAnonymous(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    throw Exception('POST $path failed: ${res.statusCode} — ${res.body}');
  }

  // ── Generic PUT ────────────────────────────────────────────────────────────
  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (res.statusCode == 200 || res.statusCode == 204) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    throw Exception('PUT $path failed: ${res.statusCode} — ${res.body}');
  }

  // ── Generic PATCH ──────────────────────────────────────────────────────────
  Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final headers = await _authHeaders();
    final res = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (res.statusCode == 200 || res.statusCode == 204) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    throw Exception('PATCH $path failed: ${res.statusCode} — ${res.body}');
  }

  // ── Generic DELETE ─────────────────────────────────────────────────────────
  Future<void> delete(String path) async {
    final headers = await _authHeaders();
    final res = await http.delete(Uri.parse('$baseUrl$path'), headers: headers);
    if (res.statusCode != 200 && res.statusCode != 204) {
      throw Exception('DELETE $path failed: ${res.statusCode}');
    }
  }

  // ── Company ────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getCompanies() =>
      get('/api/v1/companies').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> createCompany(Map<String, dynamic> data) =>
      post('/api/v1/companies', data);
  Future<dynamic> updateCompany(int id, Map<String, dynamic> data) =>
      put('/api/v1/companies/$id', data);
  Future<void> deleteCompany(int id) => delete('/api/v1/companies/$id');

  // ── Users ──────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getUsers() =>
      get('/api/User').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getUser(int id) => get('/api/User/$id');
  Future<dynamic> createUser(Map<String, dynamic> data) =>
      post('/api/User', data);
  Future<dynamic> updateUser(int id, Map<String, dynamic> data) =>
      put('/api/User/$id', data);
  Future<void> deleteUser(int id) => delete('/api/User/$id');

  // ── Drivers ──────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getDrivers() =>
      get('/api/Drivers').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getDriver(int id) => get('/api/Drivers/$id');
  Future<dynamic> createDriver(Map<String, dynamic> data) =>
      post('/api/Drivers', data);
  Future<dynamic> updateDriver(int id, Map<String, dynamic> data) =>
      put('/api/Drivers/$id', data);
  Future<void> deleteDriver(int id) => delete('/api/Drivers/$id');

  // ── Licenses ────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getLicenses() =>
      get('/api/v1/licenses').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getLicense(String licenseNumber) => get('/api/v1/licenses/$licenseNumber');
  Future<dynamic> createLicense(Map<String, dynamic> data) =>
      post('/api/v1/licenses', data);
  Future<dynamic> updateLicense(String licenseNumber, Map<String, dynamic> data) =>
      put('/api/v1/licenses/$licenseNumber', data);
  Future<void> deleteLicense(String licenseNumber) => delete('/api/v1/licenses/$licenseNumber');


  // ── Vehicles ───────────────────────────────────────────────────────────────
  Future<List<dynamic>> getVehicles() =>
      get('/api/v1/vehicles').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getVehicle(String plate) => get('/api/v1/vehicles/$plate');
  Future<dynamic> createVehicle(Map<String, dynamic> data) =>
      post('/api/v1/vehicles', data);
  Future<dynamic> updateVehicle(String plate, Map<String, dynamic> data) =>
      put('/api/v1/vehicles/$plate', data);
  Future<void> deleteVehicle(String plate) => delete('/api/v1/vehicles/$plate');

  // ── Vehicle Registries (Ruhsat) ────────────────────────────────────────────
  Future<List<dynamic>> getVehicleRegistrations() =>
      get('/api/v1/vehicle-registrations').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getVehicleRegistration(String regNum) =>
      get('/api/v1/vehicle-registrations/$regNum');
  Future<dynamic> createVehicleRegistration(Map<String, dynamic> data) =>
      post('/api/v1/vehicle-registrations', data);
  Future<dynamic> updateVehicleRegistration(
    String regNum,
    Map<String, dynamic> data,
  ) => put('/api/v1/vehicle-registrations/$regNum', data);
  Future<void> deleteVehicleRegistration(String regNum) =>
      delete('/api/v1/vehicle-registrations/$regNum');
  // ── Rentals ────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getRentals() =>
      get('/api/v1/rentals/my-rentals').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<List<dynamic>> getAllRentals() =>
      get('/api/v1/rentals/all').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> createRentalRequest(Map<String, dynamic> data) =>
      post('/api/v1/rentals/request', data);

  Future<dynamic> returnRental(int id, Map<String, dynamic> data) =>
      patch('/api/v1/rentals/$id/return', data);

  Future<dynamic> approveRental(int id) =>
      patch('/api/v1/rentals/$id/approve', {});

  Future<dynamic> rejectRental(int id) =>
      patch('/api/v1/rentals/$id/reject', {});

  /// Updates the isActive flag of a vehicle via GET+PUT.
  Future<dynamic> patchVehicleActive(String plate, bool isActive) async {
    final v = await getVehicle(plate) as Map<String, dynamic>;
    return updateVehicle(plate, {
      'plate': v['plate'],
      'registrationNumber': v['registrationNumber'],
      'currentKm': v['currentKm'] ?? 0,
      'baseRentPrice': v['baseRentPrice'] ?? 0,
      'insuranceEndDate': v['insuranceEndDate'],
      'cascoEndDate': v['cascoEndDate'],
      'inspectionEndDate': v['inspectionEndDate'],
      'nextMaintenanceKm': v['nextMaintenanceKm'] ?? 0,
      'isActive': isActive,
      'companyId': v['companyId'],
      'damageRecordAmount': v['damageRecordAmount'] ?? 0,
    });
  }

  /// Updates the baseRentPrice of a vehicle via GET+PUT.
  Future<dynamic> patchVehicleRentPrice(String plate, double price) async {
    final v = await getVehicle(plate) as Map<String, dynamic>;
    return updateVehicle(plate, {
      'plate': v['plate'],
      'registrationNumber': v['registrationNumber'],
      'currentKm': v['currentKm'] ?? 0,
      'baseRentPrice': price,
      'insuranceEndDate': v['insuranceEndDate'],
      'cascoEndDate': v['cascoEndDate'],
      'inspectionEndDate': v['inspectionEndDate'],
      'nextMaintenanceKm': v['nextMaintenanceKm'] ?? 0,
      'isActive': v['isActive'] ?? true,
      'companyId': v['companyId'],
      'damageRecordAmount': v['damageRecordAmount'] ?? 0,
    });
  }

  // ── Managers ───────────────────────────────────────────────────────────────
  Future<List<dynamic>> getManagers() =>
      get('/api/v1/managers').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> getManager(int id) => get('/api/v1/managers/$id');
  Future<dynamic> createManager(Map<String, dynamic> data) =>
      post('/api/v1/managers', data);
  Future<dynamic> updateManager(int id, Map<String, dynamic> data) =>
      put('/api/v1/managers/$id', data);
  Future<void> deleteManager(int id) => delete('/api/v1/managers/$id');
  Future<List<dynamic>> getManagerPermissions(int managerId) =>
      get('/api/v1/managers/$managerId/permissions')
          .then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);

  // ── Permissions ───────────────────────────────────────────────────────────
  Future<List<dynamic>> getPermissions() =>
      get('/api/Permission').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);

  // ── ManagerPermission ─────────────────────────────────────────────────────
  Future<List<dynamic>> getManagerPermissionLinks() =>
      get('/api/ManagerPermission').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> createManagerPermission(Map<String, dynamic> data) =>
      post('/api/ManagerPermission', data);
  Future<void> deleteManagerPermission(int id) =>
      delete('/api/ManagerPermission/$id');

  // ── Departments ───────────────────────────────────────────────────────────
  Future<List<dynamic>> getDepartments() =>
      get('/api/v1/departments').then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<List<dynamic>> getDepartmentsByCompany(int companyId) =>
      get('/api/v1/departments/company/$companyId')
          .then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);
  Future<dynamic> createDepartment(Map<String, dynamic> data) =>
      post('/api/v1/departments', data);
  Future<dynamic> updateDepartment(int id, Map<String, dynamic> data) =>
      put('/api/v1/departments/$id', data);
  Future<void> deleteDepartment(int id) => delete('/api/v1/departments/$id');

  // ── Locations (Warehouses) ─────────────────────────────────────────────────
  /// GET /api/Locations/company/{companyId}
  Future<List<dynamic>> getLocationsByCompany(int companyId) =>
      get('/api/Locations/company/$companyId')
          .then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);

  /// POST /api/Locations
  /// body: { companyId, locationName, latitude, longitude, address: { fullAddress } }
  Future<dynamic> createLocation(Map<String, dynamic> data) =>
      post('/api/Locations', data);

  /// PUT /api/Locations/{id}
  Future<dynamic> updateLocation(int id, Map<String, dynamic> data) =>
      put('/api/Locations/$id', data);

  /// DELETE /api/Locations/{id}
  Future<void> deleteLocation(int id) => delete('/api/Locations/$id');

  // ── Trips (Seferler) ───────────────────────────────────────────────────────
  
  /// GET /api/Trips/active/{companyId}
  Future<List<dynamic>> getActiveTripsByCompany(int companyId) =>
      get('/api/Trips/active/$companyId')
          .then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);

  /// GET /api/Trips/all
  Future<List<dynamic>> getAllTrips() =>
      get('/api/Trips/all')
          .then((v) => (v is List ? v : v['value'] ?? []) as List<dynamic>);

  /// POST /api/Trips/start
  /// body: { driverId, vehiclePlate, startLocationId, endLocationId }
  Future<dynamic> startTrip(Map<String, dynamic> data) =>
      post('/api/Trips/start', data);

  /// PATCH /api/Trips/{id}/complete
  /// body: { endKm }
  Future<dynamic> completeTrip(int tripId, double endKm) =>
      patch('/api/Trips/$tripId/complete', {'endKm': endKm});
}

