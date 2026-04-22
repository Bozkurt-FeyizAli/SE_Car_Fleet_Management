import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobil/screens/driver_map_screen.dart';
import 'package:mobil/services/api_service.dart';

void main() {
  testWidgets('MyWidget has a map', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(
      home: DriverMapScreen(
        trip: {'id': 1, 'vehiclePlate': '34ABC123'},
        locations: [],
        apiService: ApiService(),
      ),
    ));
    await tester.pumpAndSettle();
  });
}
