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

// Sistem Yöneticisi için İkon (Canlı Kamyon Pini)
const truckDivIcon = new L.DivIcon({
  html: `<div style="font-size: 24px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #3b82f6; transform: scaleX(-1);">🚚</div>`,
  className: "custom-truck-icon bg-transparent border-none",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// OSRM üzerinden rota çizen ve pini gösteren alt component
function TripRoute({ startLoc, endLoc, trip }: { startLoc: any, endLoc: any, trip: any }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (routeCoords.length === 0) return;
    // Araç teleport olmasın, sefer başlangıcından itibaren 2 saatlik (7200000 ms) simülasyon üzerinden hesapla
    const DUR = 7200000; 
    const interval = setInterval(() => {
      const start = trip.startTime ? new Date(trip.startTime).getTime() : Date.now() - 300000;
      let elapsed = Date.now() - start;
      // Eğer simülasyon 2 saati aşmışsa, tekrar başa dönmesini/ya da durmasını önlemek için modulo alıp dönmesini sağlayalım ki sürekli animasyon görebilelim.
      let currentProgress = (elapsed % DUR) / DUR;
      if (trip.status === "InTrip" && currentProgress >= 1) currentProgress = 0.99;

      const index = Math.floor(currentProgress * (routeCoords.length - 1));
      if (routeCoords[index]) {
        setCurrentPos(routeCoords[index]);
        setProgress(Math.round(currentProgress * 100));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [routeCoords, trip.startTime, trip.status]);

  if (!startLoc) return null;
  
  const displayPos = currentPos || [startLoc.latitude, startLoc.longitude];

  return (
    <>
      {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.6} dashArray="5, 10" />}
      <Marker position={displayPos as [number, number]} icon={truckDivIcon}>
        <Popup>
          <div className="text-sm p-1 min-w-[200px]">
            <span className="font-bold text-xs bg-indigo-100 text-indigo-900 px-2 py-1 border rounded inline-block mb-2 flex items-center gap-1 w-fit">🚚 Aktif Sefer</span>
            <strong>Şoför ID:</strong> {trip.driverId}<br/>
            <strong>Araç Plakası:</strong> {trip.vehiclePlate}<br/>
            <strong>Güzergah:</strong> {startLoc.locationName} ➔ {endLoc?.locationName || "Bilinmiyor"}<br/>
            {distance > 0 && <span className="text-xs text-muted-foreground mt-1 block">Hesaplanan Rota: ~{distance} km</span>}
            <div className="mt-2 text-xs">
              <strong>İlerleme:</strong> %{progress}
              <div className="w-full bg-slate-200 h-2 rounded mt-1 overflow-hidden">
                <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
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

function generateAddress(f: any) {
  const parts = [];
  if (f.neighborhood) parts.push(`${f.neighborhood} Mah.`);
  if (f.street) parts.push(f.street);
  if (f.buildingType) parts.push(f.buildingType);
  if (f.doorNo) parts.push(`No: ${f.doorNo}`);
  if (f.district || f.city) parts.push(`${f.district}/${f.city}`.replace(/^\/|\/$/g, ''));
  return parts.join(" ");
}

export function LocationsTab() {
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number>(41.0082); // Default istanbul
  const [selectedLng, setSelectedLng] = useState<number>(28.9784);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [neighborhoodsList, setNeighborhoodsList] = useState<any[]>([]);
  const [form, setForm] = useState({
    locationName: "",
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    buildingType: "",
    doorNo: "",
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

  const fetchCities = async () => {
    try {
      const res = await fetch("https://turkiyeapi.dev/api/v1/provinces");
      const json = await res.json();
      setCitiesList(json.data || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCities();
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
      const neighborhoodStr = data.address?.neighbourhood || data.address?.quarter || "";
      const streetStr = data.address?.road || data.address?.pedestrian || "";
      const doorNoStr = data.address?.house_number || "";
      
      setForm(prev => {
        const updated = {
          ...prev,
          city: cityStr,
          district: distStr,
          neighborhood: neighborhoodStr,
          street: streetStr,
          doorNo: doorNoStr,
        };
        updated.fullAddress = data.display_name || generateAddress(updated);
        return updated;
      });
      
      setCitiesList(cities => {
        const matched = cities.find(c => c.name === cityStr);
        if (matched) {
          setDistrictsList(matched.districts || []);
          const matchedDistrict = matched.districts?.find((d: any) => d.name === distStr);
          if (matchedDistrict) {
             fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${matchedDistrict.id}`)
               .then(r => r.json())
               .then(d => setNeighborhoodsList(d.data || []))
               .catch(() => setNeighborhoodsList([]));
          } else {
             setNeighborhoodsList([]);
          }
        }
        return cities;
      });
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

  const geocodeAddress = async (addressStr: string) => {
    if (!addressStr) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&countrycodes=tr&limit=1`, { headers: { 'Accept-Language': 'tr' }});
      const data = await res.json();
      if (data && data.length > 0) {
        setSelectedLat(Number(data[0].lat));
        setSelectedLng(Number(data[0].lon));
        setMapCenter([Number(data[0].lat), Number(data[0].lon)]);
      }
    } catch(e) {}
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
      const neighborhoodStr = data.address?.neighbourhood || data.address?.quarter || "";
      const streetStr = data.address?.road || data.address?.pedestrian || "";
      const doorNoStr = data.address?.house_number || "";
      
      setForm(prev => {
        const updated = {
          ...prev,
          city: cityStr,
          district: distStr,
          neighborhood: neighborhoodStr,
          street: streetStr,
          doorNo: doorNoStr,
        };
        updated.fullAddress = data.display_name || result.display_name || generateAddress(updated);
        return updated;
      });
      
      setCitiesList(cities => {
        const matched = cities.find(c => c.name === cityStr);
        if (matched) {
          setDistrictsList(matched.districts || []);
          const matchedDistrict = matched.districts?.find((d: any) => d.name === distStr);
          if (matchedDistrict) {
             fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${matchedDistrict.id}`)
               .then(r => r.json())
               .then(d => setNeighborhoodsList(d.data || []))
               .catch(() => setNeighborhoodsList([]));
          } else {
             setNeighborhoodsList([]);
          }
        }
        return cities;
      });
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
          neighborhood: form.neighborhood || "",
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
      setForm({ locationName: "", city: "", district: "", neighborhood: "", street: "", buildingType: "", doorNo: "", fullAddress: "" });
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
        onAdd={() => { setEditItem(null); setForm({ locationName: "", city: "", district: "", neighborhood: "", street: "", buildingType: "", doorNo: "", fullAddress: "" }); setDistrictsList([]); setNeighborhoodsList([]); setShowForm(true); }} 
        onEdit={async (d) => {
           setEditItem(d);
           setSelectedLat(d.latitude);
           setSelectedLng(d.longitude);
           setMapCenter([d.latitude, d.longitude]);

           // Önce kayıtlı veriyi doldur
           const storedCity = d.address?.city || d.city || "";
           const storedDistrict = d.address?.district || d.district || "";
           const storedNeighborhood = d.address?.neighborhood || "";

           setForm({
             locationName: d.locationName,
             city: storedCity,
             district: storedDistrict,
             neighborhood: storedNeighborhood,
             street: "",
             buildingType: "",
             doorNo: "",
             fullAddress: d.address?.fullAddress || d.fullAddress || ""
           });
           
           setCitiesList(cities => {
             const matched = cities.find(c => c.name === storedCity);
             if (matched) {
               setDistrictsList(matched.districts || []);
               const matchedDistrict = matched.districts?.find((dist: any) => dist.name === storedDistrict);
               if (matchedDistrict) {
                 fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${matchedDistrict.id}`)
                   .then(r => r.json())
                   .then(d => setNeighborhoodsList(d.data || []))
                   .catch(() => setNeighborhoodsList([]));
               } else {
                 setNeighborhoodsList([]);
               }
             }
             return cities;
           });

           setShowForm(true);

           // Şehir/ilçe boşsa koordinattan reverse geocode ile doldur
           if (!storedCity || !storedDistrict) {
             try {
               const res = await fetch(
                 `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${d.latitude}&lon=${d.longitude}`,
                 { headers: { 'Accept-Language': 'tr' } }
               );
               const geo = await res.json();
               const cityStr = geo.address?.province || geo.address?.city || geo.address?.state || storedCity;
               const distStr = geo.address?.town || geo.address?.suburb || geo.address?.village || geo.address?.city_district || storedDistrict;
               setForm(prev => {
                 const updated = {
                   ...prev,
                   city: prev.city || cityStr,
                   district: prev.district || distStr,
                 };
                 updated.fullAddress = generateAddress(updated);
                 return updated;
               });
               
               setCitiesList(cities => {
                 const matched = cities.find(c => c.name === (storedCity || cityStr));
                 if (matched) {
                   setDistrictsList(matched.districts || []);
                   const matchedDistrict = matched.districts?.find((dist: any) => dist.name === (storedDistrict || distStr));
                   if (matchedDistrict) {
                     fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${matchedDistrict.id}`)
                       .then(r => r.json())
                       .then(d => setNeighborhoodsList(d.data || []))
                       .catch(() => setNeighborhoodsList([]));
                   } else {
                     setNeighborhoodsList([]);
                   }
                 }
                 return cities;
               });
             } catch (err) {
               console.error("Reverse geocode hatası:", err);
             }
           }
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
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.city} 
              onChange={e => {
                const city = e.target.value;
                const matchedCity = citiesList.find((c: any) => c.name === city);
                setDistrictsList(matchedCity?.districts || []);
                setNeighborhoodsList([]);
                const updated = { ...form, city, district: "", neighborhood: "" };
                updated.fullAddress = generateAddress(updated);
                setForm(updated);
                geocodeAddress(updated.fullAddress);
              }}
            >
              <option value="">Seçiniz...</option>
              {citiesList.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="İlçe">
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.district} 
              onChange={e => {
                const district = e.target.value;
                const matchedDistrict = districtsList.find((d: any) => d.name === district);
                if (matchedDistrict) {
                  fetch(`https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${matchedDistrict.id}`)
                    .then(r => r.json())
                    .then(d => setNeighborhoodsList(d.data || []))
                    .catch(() => setNeighborhoodsList([]));
                } else {
                  setNeighborhoodsList([]);
                }
                const updated = { ...form, district, neighborhood: "" };
                updated.fullAddress = generateAddress(updated);
                setForm(updated);
                geocodeAddress(updated.fullAddress);
              }}
              disabled={!form.city}
            >
              <option value="">Seçiniz...</option>
              {districtsList.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Mahalle">
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.neighborhood} 
              onChange={e => {
                const updated = { ...form, neighborhood: e.target.value };
                updated.fullAddress = generateAddress(updated);
                setForm(updated);
                geocodeAddress(updated.fullAddress);
              }}
              disabled={!form.district}
            >
              <option value="">Seçiniz...</option>
              {neighborhoodsList.map((n: any) => <option key={n.id} value={n.name}>{n.name}</option>)}
            </select>
          </Field>
          <Field label="Cadde / Sokak">
            <Input 
              placeholder="Örn: İstiklal Cad. Gül Sok."
              value={form.street} 
              onChange={e => {
                const updated = { ...form, street: e.target.value };
                updated.fullAddress = generateAddress(updated);
                setForm(updated);
              }}
              onBlur={() => geocodeAddress(form.fullAddress)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bina / Ev Tipi">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.buildingType} 
                onChange={e => {
                  const updated = { ...form, buildingType: e.target.value };
                  updated.fullAddress = generateAddress(updated);
                  setForm(updated);
                  geocodeAddress(updated.fullAddress);
                }}
              >
                <option value="">Seçiniz...</option>
                <option value="Apartman">Apartman</option>
                <option value="Müstakil Ev">Müstakil Ev</option>
                <option value="Plaza / İş Merkezi">Plaza / İş Merkezi</option>
                <option value="Site">Site</option>
                <option value="Depo / Tesis">Depo / Tesis</option>
              </select>
            </Field>
            <Field label="Bina/Kapı No">
              <Input value={form.doorNo} onChange={e => {
                  const updated = { ...form, doorNo: e.target.value };
                  updated.fullAddress = generateAddress(updated);
                  setForm(updated);
                  geocodeAddress(updated.fullAddress);
                }} />
            </Field>
          </div>
          <Field label="Oluşan Açık Adres *">
            <Input value={form.fullAddress} onChange={e => setForm({ ...form, fullAddress: e.target.value })} />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
