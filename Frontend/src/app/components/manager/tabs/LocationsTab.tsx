import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { FormDialog, Field } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { currentCompany } from "../ManagerPanel";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Sistem Yöneticisi için Mavi pin Icon (Kamyon temsil)
const truckIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "hue-rotate-[240deg]", // Mavi/Lacivert tonlarında bir pin
});

// OSRM üzerinden rota çizen ve pini gösteren alt component
function TripRoute({ startLoc, endLoc, trip }: { startLoc: any, endLoc: any, trip: any }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!startLoc || !endLoc) return;
    fetch(`https://router.project-osrm.org/route/v1/driving/${startLoc.longitude},${startLoc.latitude};${endLoc.longitude},${endLoc.latitude}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(d => {
        if (d.routes && d.routes.length > 0) {
          const coords = d.routes[0].geometry.coordinates.map((c: any[]) => [c[1], c[0]]);
          setRouteCoords(coords);
          setDistance(Math.round(d.routes[0].distance / 1000));
        }
      }).catch(console.error);
  }, [startLoc, endLoc]);

  if (!startLoc) return null;

  return (
    <>
      {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.8} dashArray="10, 10" />}
      <Marker position={[startLoc.latitude, startLoc.longitude]} icon={truckIcon}>
        <Popup>
          <div className="text-sm p-1">
            <span className="font-bold text-xs bg-indigo-100 text-indigo-900 px-2 py-1 border rounded inline-block mb-2">🚚 Aktif Sefer</span><br/>
            <strong>Şoför ID:</strong> {trip.driverId}<br/>
            <strong>Araç Plakası:</strong> {trip.vehiclePlate}<br/>
            <strong>Güzergah:</strong> {startLoc.locationName} ➔ {endLoc?.locationName || "Bilinmiyor"}<br/>
            {distance > 0 && <span className="text-xs text-muted-foreground mt-1 block">Hesaplanan Rota: ~{distance} km</span>}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

// This component captures map clicks and updates standard state
function MapEventsHandler({ onLocationSelect, mapCenter }: { onLocationSelect: (latlng: L.LatLng) => void, mapCenter: [number, number] }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  
  useEffect(() => {
    if (mapCenter[0] !== 41.0082 || mapCenter[1] !== 28.9784) {
      map.flyTo(mapCenter, 14);
    }
  }, [mapCenter, map]);

  return null;
}

export function LocationsTab() {
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number>(41.0082); // Default istanbul
  const [selectedLng, setSelectedLng] = useState<number>(28.9784);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [form, setForm] = useState({
    locationName: "",
    city: "",
    district: "",
    fullAddress: ""
  });
  const [editItem, setEditItem] = useState<any>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [locResult, tripsResult] = await Promise.all([
        apiFetch(`/Locations/company/${currentCompany.id}`).catch(() => []),
        apiFetch(`/Trips/active/${currentCompany.id}`).catch(() => [])
      ]);
      
      if (Array.isArray(locResult)) setData(locResult);
      else if (locResult && Array.isArray(locResult.data)) setData(locResult.data);
      else setData([]);

      let trips: any[] = [];
      if (Array.isArray(tripsResult)) {
        setActiveTrips(tripsResult);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMapClick = async (latlng: L.LatLng) => {
    setSelectedLat(latlng.lat);
    setSelectedLng(latlng.lng);
    setShowForm(true);
    
    // Reverse Geocoding
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`, { headers: { 'Accept-Language': 'tr' }});
      const data = await res.json();
      
      const cityStr = data.address?.province || data.address?.city || data.address?.state || "";
      const distStr = data.address?.town || data.address?.suburb || data.address?.village || data.address?.city_district || "";
      
      setForm(prev => ({
        ...prev,
        city: cityStr,
        district: distStr,
        fullAddress: data.display_name || ""
      }));
    } catch(err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=tr&limit=5`, { headers: { 'Accept-Language': 'tr' }});
      const data = await res.json();
      setSearchResults(data);
    } catch(err) {
      console.error(err);
    }
  };

  const selectSearchResult = async (result: any) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    
    setSelectedLat(lat);
    setSelectedLng(lon);
    setMapCenter([lat, lon]);
    setSearchResults([]);
    setSearchQuery("");
    setEditItem(null);
    setShowForm(true);

    // Get proper address breakdown
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': 'tr' }});
      const data = await res.json();
      
      const cityStr = data.address?.province || data.address?.city || data.address?.state || "";
      const distStr = data.address?.town || data.address?.suburb || data.address?.village || data.address?.city_district || "";
      
      setForm(prev => ({
        ...prev,
        city: cityStr,
        district: distStr,
        fullAddress: data.display_name || result.display_name || ""
      }));
    } catch(err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!form.locationName || !form.city || !form.fullAddress) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        companyId: currentCompany.id,
        locationName: form.locationName,
        latitude: selectedLat,
        longitude: selectedLng,
        address: {
          city: form.city,
          district: form.district || "",
          neighborhood: "",
          fullAddress: form.fullAddress,
          zipCode: ""
        }
      };

      if (editItem) {
        // Optimistic PUT call, backend developers can implement this endpoint later
        await apiFetch(`/Locations/${editItem.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        toast.success("Konum başarıyla güncellendi");
      } else {
        await apiFetch("/Locations", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Konum başarıyla eklendi");
      }

      setShowForm(false);
      setEditItem(null);
      setForm({ locationName: "", city: "", district: "", fullAddress: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Konum Adı", render: (r) => r.locationName },
    { key: "address", header: "Adres", render: (r) => r.address?.fullAddress || r.fullAddress || "Adres Yok" },
    { key: "lat", header: "Enlem", render: (r) => r.latitude.toFixed(4) },
    { key: "lng", header: "Boylam", render: (r) => r.longitude.toFixed(4) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Operasyon Konumları</h2>
        <div className="relative w-full sm:w-80 z-[2000]">
          <div className="flex gap-2">
            <Input 
              placeholder="Haritada şehir, ilçe, adres ara..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="bg-background"
            />
            <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Ara
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-11 left-0 w-full bg-card border border-border rounded-md shadow-xl overflow-hidden">
              {searchResults.map((res: any, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-2 text-sm hover:bg-muted cursor-pointer border-b border-border last:border-0"
                  onClick={() => selectSearchResult(res)}
                >
                  {res.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg overflow-hidden h-[400px] shadow-sm relative z-0 mt-4">
        <MapContainer center={[41.0082, 28.9784]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onLocationSelect={handleMapClick} mapCenter={mapCenter} />
          
          {data.map((loc: any) => (
            <Marker key={loc.id || loc.locationName} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <strong>{loc.locationName}</strong><br/>
                {loc.address?.fullAddress || loc.fullAddress || "Adres Yok"}
              </Popup>
            </Marker>
          ))}

          {activeTrips.map(trip => {
            const startLoc = data.find(l => l.id === trip.startLocationId);
            const endLoc = data.find(l => l.id === trip.endLocationId);
            return <TripRoute key={`trip-${trip.id}`} startLoc={startLoc} endLoc={endLoc} trip={trip} />;
          })}
        </MapContainer>
        
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-900/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-[1000] pointer-events-none">
          Haritada bir yere tıklayarak yeni konum kaydedebilirsiniz
        </div>
      </div>

      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Konum ara..." 
        searchKeys={["locationName"]} 
        onAdd={() => { setEditItem(null); setForm({ locationName: "", city: "", district: "", fullAddress: "" }); setShowForm(true); }} 
        onEdit={(d) => {
           setEditItem(d);
           setSelectedLat(d.latitude);
           setSelectedLng(d.longitude);
           setMapCenter([d.latitude, d.longitude]);
           setForm({
             locationName: d.locationName,
             city: d.address?.city || d.city || "",
             district: d.address?.district || d.district || "",
             fullAddress: d.address?.fullAddress || d.fullAddress || ""
           });
           setShowForm(true);
        }}
        addLabel="Yeni Konum (Manuel)" 
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Konumu Düzenle" : "Yeni Konum Ekle"} onSubmit={handleSave}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded text-sm text-muted-foreground mb-4">
            <div><strong>Seçilen Enlem:</strong> {selectedLat.toFixed(6)}</div>
            <div><strong>Seçilen Boylam:</strong> {selectedLng.toFixed(6)}</div>
          </div>
          
          <Field label="Konum Adı (Örn: Depo, Merkez) *">
            <Input value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })} />
          </Field>
          <Field label="Şehir *">
            <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="İlçe">
            <Input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
          </Field>
          <Field label="Açık Adres *">
            <Input value={form.fullAddress} onChange={e => setForm({ ...form, fullAddress: e.target.value })} />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
