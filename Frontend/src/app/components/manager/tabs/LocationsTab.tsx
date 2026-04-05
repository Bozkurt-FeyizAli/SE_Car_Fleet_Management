import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { FormDialog, Field } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { currentCompany } from "../ManagerPanel";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// This component captures map clicks and updates standard state
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export function LocationsTab() {
  const [data, setData] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number>(41.0082); // Default istanbul
  const [selectedLng, setSelectedLng] = useState<number>(28.9784);
  const [form, setForm] = useState({
    locationName: "",
    city: "",
    district: "",
    fullAddress: ""
  });
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    try {
      const result = await apiFetch(`/Locations/company/${currentCompany.id}`);
      if (Array.isArray(result)) setData(result);
      else if (result && Array.isArray(result.data)) setData(result.data);
      else setData([]);
    } catch (error: any) {
      toast.error("Konumlar getirilemedi: " + error.message);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleMapClick = (latlng: L.LatLng) => {
    setSelectedLat(latlng.lat);
    setSelectedLng(latlng.lng);
    setShowForm(true);
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

      await apiFetch("/Locations", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Konum başarıyla eklendi");
      setShowForm(false);
      setForm({ locationName: "", city: "", district: "", fullAddress: "" });
      fetchLocations();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Konum Adı", render: (r) => r.locationName },
    { key: "city", header: "Şehir", render: (r) => r.address?.city || r.city || "—" },
    { key: "address", header: "Adres", render: (r) => r.address?.fullAddress || r.fullAddress || "—" },
    { key: "lat", header: "Enlem", render: (r) => r.latitude.toFixed(4) },
    { key: "lng", header: "Boylam", render: (r) => r.longitude.toFixed(4) },
  ];

  return (
    <div className="space-y-6">
      <h2 className="mb-4">Operasyon Konumları</h2>
      
      <div className="bg-card border border-border rounded-lg overflow-hidden h-[400px] shadow-sm relative z-0">
        <MapContainer center={[41.0082, 28.9784]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          
          {data.map((loc: any) => (
            <Marker key={loc.id || loc.locationName} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <strong>{loc.locationName}</strong><br/>
                {loc.address?.fullAddress || loc.fullAddress || loc.address?.city}
              </Popup>
            </Marker>
          ))}
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
        onAdd={() => setShowForm(true)} 
        addLabel="Yeni Konum (Manuel)" 
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title="Yeni Konum Ekle" onSubmit={handleSave}>
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
