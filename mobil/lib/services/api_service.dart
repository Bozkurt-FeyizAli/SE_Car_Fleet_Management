import 'dart:convert';
import 'package:http/http.dart' as http;
import 'token_storage_service.dart';

/// Generic REST API service with JWT authentication.
/// All CRUD operations for Company, User, Vehicle, etc.
class ApiService {
  static const String baseUrl = 'http://161.35.194.242';
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
      get('/api/Company').then((v) => v as List<dynamic>);
  Future<dynamic> createCompany(Map<String, dynamic> data) =>
      post('/api/Company', data);
  Future<dynamic> updateCompany(int id, Map<String, dynamic> data) =>
      put('/api/Company/$id', data);
  Future<void> deleteCompany(int id) => delete('/api/Company/$id');

  // ── Users ──────────────────────────────────────────────────────────────────
  Future<List<dynamic>> getUsers() =>
      get('/api/User').then((v) => v as List<dynamic>);
  Future<dynamic> getUser(int id) => get('/api/User/$id');
  Future<dynamic> createUser(Map<String, dynamic> data) =>
      post('/api/User', data);
  Future<dynamic> updateUser(int id, Map<String, dynamic> data) =>
      put('/api/User/$id', data);
  Future<void> deleteUser(int id) => delete('/api/User/$id');

  // ── Vehicles ───────────────────────────────────────────────────────────────
  Future<List<dynamic>> getVehicles() =>
      get('/api/Vehicle').then((v) => v as List<dynamic>);
  Future<dynamic> getVehicle(int id) => get('/api/Vehicle/$id');
  Future<dynamic> createVehicle(Map<String, dynamic> data) =>
      post('/api/Vehicle', data);
  Future<dynamic> updateVehicle(int id, Map<String, dynamic> data) =>
      put('/api/Vehicle/$id', data);
  Future<void> deleteVehicle(int id) => delete('/api/Vehicle/$id');
}
