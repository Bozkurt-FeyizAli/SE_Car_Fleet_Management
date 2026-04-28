import "dart:convert";
import "package:http/http.dart" as http;

void main() async {
  final baseUrl = "http://mikbalceyhan.me";
  
  final body = {
    'companyId': 1,
    'locationName': "Warehouse via http package",
    'latitude': 41.0,
    'longitude': 29.0,
    'address': {'fullAddress': "Some address string"}
  };

  final headers = {
    'Content-Type': 'application/json',
  };

  try {
    final res = await http.post(
      Uri.parse("$baseUrl/api/Locations"),
      headers: headers,
      body: jsonEncode(body),
    );

    print("Status: ${res.statusCode}");
    print("Body: ${res.body}");
  } catch (e) {
    print("Error: $e");
  }
}
