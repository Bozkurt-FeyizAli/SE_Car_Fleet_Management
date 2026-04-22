import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import 'shared_styles.dart';

const _emerald = Color(0xFF059669);

class DriverMapScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final List<Map<String, dynamic>> locations;
  final ApiService apiService;

  const DriverMapScreen({
    super.key,
    required this.trip,
    required this.locations,
    required this.apiService,
  });

  @override
  State<DriverMapScreen> createState() => _DriverMapScreenState();
}

class _DriverMapScreenState extends State<DriverMapScreen> {
  final MapController _mapController = MapController();
  
  bool _loading = true;
  String? _error;

  LatLng? _startCoord;
  LatLng? _endCoord;
  LatLng? _currentCoord;

  List<LatLng> _routePoints = [];

  bool _isFollowing = true;

  @override
  void initState() {
    super.initState();
    debugPrint('DriverMapScreen: initState started');
    _initMap();
    debugPrint('DriverMapScreen: initState ended');
  }

  Future<void> _initMap() async {
    try {
      // 1) Find coords for start and end locations
      final sId = widget.trip['startLocationId'];
      final eId = widget.trip['endLocationId'];

      final sLoc = widget.locations.where((l) => l['id'] == sId).firstOrNull;
      final eLoc = widget.locations.where((l) => l['id'] == eId).firstOrNull;

      if (sLoc != null && sLoc['latitude'] != null) {
        _startCoord = LatLng(sLoc['latitude'] as double, sLoc['longitude'] as double);
      }
      if (eLoc != null && eLoc['latitude'] != null) {
        _endCoord = LatLng(eLoc['latitude'] as double, eLoc['longitude'] as double);
      }

      if (_startCoord == null || _endCoord == null) {
        throw Exception('Rota için geçerli koordinatlar bulunamadı.');
      }

      // 2) Check location permissions
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Konum servisleri kapalı.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Konum izni reddedildi.');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Konum izni kalıcı olarak reddedildi.');
      }

      // 3) Create platform-specific location settings
      LocationSettings locationSettings;
      if (defaultTargetPlatform == TargetPlatform.android) {
        locationSettings = AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
          forceLocationManager: true, // Crucial for Huawei devices without GMS
        );
      } else if (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.macOS) {
        locationSettings = AppleSettings(
          accuracy: LocationAccuracy.high,
          activityType: ActivityType.fitness,
          distanceFilter: 10,
        );
      } else {
        locationSettings = const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        );
      }

      // 4) Get initial location
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: locationSettings,
      );
      _currentCoord = LatLng(pos.latitude, pos.longitude);

      // 5) Fetch route from OSRM
      await _fetchRoute();

      // 6) Start listening to location updates
      Geolocator.getPositionStream(
        locationSettings: locationSettings,
      ).listen((Position position) {
        if (!mounted) return;
        setState(() {
          _currentCoord = LatLng(position.latitude, position.longitude);
          if (_isFollowing) {
            _mapController.move(_currentCoord!, _mapController.camera.zoom);
          }
        });
      });

      setState(() => _loading = false);

      // Initial center
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_currentCoord != null) {
          _mapController.move(_currentCoord!, 14.0);
        }
      });
      
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _fetchRoute() async {
    // We use OSRM public API to get driving route
    // It takes lon,lat format
    final startStr = '${_startCoord!.longitude},${_startCoord!.latitude}';
    final endStr = '${_endCoord!.longitude},${_endCoord!.latitude}';
    final url = 'http://router.project-osrm.org/route/v1/driving/$startStr;$endStr?overview=full&geometries=geojson';

    try {
      final res = await http.get(Uri.parse(url));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['routes'] != null && data['routes'].isNotEmpty) {
          final coords = data['routes'][0]['geometry']['coordinates'] as List;
          setState(() {
            _routePoints = coords.map((c) => LatLng(c[1] as double, c[0] as double)).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('OSRM Route fetch error: $e');
    }
  }

  void _centerOnMe() {
    setState(() => _isFollowing = true);
    if (_currentCoord != null) {
      _mapController.move(_currentCoord!, 15.0);
    }
  }

  Future<void> _openCompleteTripDialog() async {
    final kmC = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kCard,
        title: const Text('Seferi Bitir',
            style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Lütfen aracın güncel kilometre bilgisini girin.',
              style: TextStyle(color: kMuted, fontSize: 13),
            ),
            const SizedBox(height: 16),
            kField('Bitiş KM', kmC, type: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('İptal', style: TextStyle(color: kMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kBlue),
            onPressed: () => Navigator.pop(ctx, true),
            child:
                const Text('Bitir', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    final endKm = double.tryParse(kmC.text.trim().replaceAll(',', '.'));
    if (endKm == null || endKm < 0) {
      kError(context, 'Geçerli bir kilometre değeri girin.');
      return;
    }

    try {
      // Show loading overlay
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const Center(child: CircularProgressIndicator(color: kBlue)),
      );

      await widget.apiService.completeTrip(widget.trip['id'], endKm);
      
      if (!mounted) return;
      Navigator.pop(context); // pop loading dialog
      kSuccess(context, 'Sefer başarıyla tamamlandı!');
      Navigator.pop(context); // pop map screen
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // pop loading
      kError(context, 'Sefer bitirilemedi: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('DriverMapScreen: build started. loading: $_loading, error: $_error');
    if (_loading) {
      return Scaffold(
        backgroundColor: kBg,
        appBar: AppBar(backgroundColor: kCard, title: const Text('Harita Yükleniyor...')),
        body: const Center(child: CircularProgressIndicator(color: _emerald)),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: kBg,
        appBar: AppBar(backgroundColor: kCard, title: const Text('Hata')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: Colors.red, size: 60),
                const SizedBox(height: 16),
                Text(
                  _error!,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    debugPrint('DriverMapScreen: building main scaffold');
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kCard,
        elevation: 1,
        title: Text(
          'Sefer ${widget.trip['vehiclePlate']}',
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _startCoord ?? const LatLng(39.92077, 32.85411),
              initialZoom: 13.0,
              onPositionChanged: (pos, hasGesture) {
                if (hasGesture) {
                  setState(() => _isFollowing = false);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.se.fleet',
              ),
              PolylineLayer(
                polylines: [
                  if (_routePoints.isNotEmpty)
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 5.0,
                      color: Colors.blueAccent.withValues(alpha: 0.8),
                    ),
                ],
              ),
              MarkerLayer(
                markers: [
                  if (_startCoord != null)
                    Marker(
                      point: _startCoord!,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.flag_rounded, color: Colors.orange, size: 36),
                    ),
                  if (_endCoord != null)
                    Marker(
                      point: _endCoord!,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.location_on_rounded, color: Colors.red, size: 36),
                    ),
                  if (_currentCoord != null)
                    Marker(
                      point: _currentCoord!,
                      width: 30,
                      height: 30,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 5,
                            )
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // Re-center button
          Positioned(
            top: 20,
            right: 20,
            child: FloatingActionButton(
              heroTag: 'centerBtn',
              backgroundColor: _isFollowing ? _emerald : kCard,
              mini: true,
              onPressed: _centerOnMe,
              child: Icon(
                Icons.my_location_rounded,
                color: _isFollowing ? Colors.white : kMuted,
              ),
            ),
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'finishTripBtn',
        backgroundColor: Colors.red,
        onPressed: _openCompleteTripDialog,
        icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
        label: const Text(
          'Seferi Bitir',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
