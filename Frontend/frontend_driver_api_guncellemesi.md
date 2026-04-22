# Driver API Entegrasyonu Geliştirmeleri

Bu dokümanda, `Driver` ekleme ve güncelleme işlemlerinin güncel backend API'leri ile (`POST /api/Drivers` ve `PUT /api/Drivers/{id}`) tam uyumlu çalışabilmesi için frontend tarafında yapılan değişiklikler loglanmıştır. 

## Yapılan Değişiklikler

**1. Manager ve System Admin Şoför Formlarının Güncellenmesi**
- Şoför ekleme/düzenleme formlarına **"Durum" (Status)** (Boşta, Seferde, İzinli vb.) ve **"Araç Plakası" (VehiclePlate)** alanları eklendi.
- Böylece şoför oluştururken apinin beklediği `status` ve `vehiclePlate` gibi alanlar artık arayüzden direkt olarak gönderilebiliyor.

**2. API Payload Uyumluluğunun Sağlanması**
- Backend tarafındaki `Driver` DTO'sunun beklediği JSON şemasına birebir uyum sağlandı:
```json
{
  "userId": 0,
  "vehiclePlate": "string",
  "licenseNumber": "string",
  "points": 0,
  "status": "string"
}
```
- Özellikle `PUT /api/Drivers/{id}` endpointi için payload'a `id` değerinin de eklenmesi sağlandı (Güncellemelerde hata vermesini önlemek adına).
- `status` ve `points` alanları map edilirken oluşabilecek null senaryoları frontend tarafında ele alınarak (örn: varsayılan `100` veya `0` puan ve `"Idle"` durumu) backend'e doğru değerlerin gitmesi garantilendi.

**3. Dosya Değişiklikleri**
- `Frontend/src/app/components/system-admin/tabs/DriversTab.tsx`
  - Forma "Durum" ve "Araç Plakası" select kutuları eklendi.
  - Driver payload şeması güncellendi.
- `Frontend/src/app/components/manager/tabs/DriversTab.tsx`
  - Forma "Durum" ve "Atanan Araç" select kutuları eklendi.
  - Driver payload şeması güncellendi.

**4. Sürücü ve Kullanıcı API'lerinin Tam Ayrıştırılması (Decoupling: 19.04.2026)**
- Daha önce Backend'in desteklemediği düşünülen (veya User modelinde yer almayan) Ehliyet numarası, Araç Plakası, Puan ve Durum gibi veriler `localStorage` metadataları vasıtasıyla saklanıyordu ve User payload'una ekleniyordu.
- **Yapılan Güncelleme:** `POST /api/User` payload'u tamamen temizlendi. Backend User uç noktası sadece Ad, Soyad, TC Kimlik No, İletişim Bilgileri, ve Rol bilgilerini taşıyacak hale getirildi. 
- Hemen ardından çağrılan `POST /api/Drivers` (veya `PUT /api/Drivers`) çağrısında ise SADECE Sürücü (Driver) modelini ilgilendiren özel bilgiler gönderilecek şekilde arayüz API mimiği düzenlendi.
- Bu sayede Frontend, `localStorage` hack'lerinden kurtarıldı. Sistemsel bütünlük saf API endpointleri ile güvence altına alındı. Liste çekimlerinde tamamen `fetch("/api/Drivers")` den dönen ana değerlere (gerçek Driver varlıklarına) odaklanıldı.

**5. 500 Internal Server Hatasının Engellenmesi için Validasyonlar**
- **Sorun:** Frontend'de yeni kullanıcı/sürücü eklenirken şifre girilmediğinde C# tarafındaki `UserService` içerisindeki kontrol `ArgumentException` fırlatarak `"500 Internal Server Error"`'a neden oluyordu.
- **Çözüm:** `DriversTab.tsx` ve `UsersTab.tsx` dosyalarındaki (Manager ve System-Admin için) form kaydetme (`handleSave`) işlemlerine **Şifre Zorunluluğu** eklendi. Ayrıca Manager/System Admin spesifik olarak `CompanyId` seçilmeden ilerlenmesinin foreign key constraint (Yabancı Anahtar) ihlaline yol açması engellendi.

**6. TypeScript Derleme ve Tip (Type) Hatalarının Giderilmesi**
- `driverLicenseType` alanı `ApiUser` modelinden kaldırıldığı için `UsersTab.tsx`'de form ilk yükleme, state setleme ve JSX içerisindeki kullanımlar temizlenecek şekilde düzeltildi (Type Not Found Hatası giderildi).
- `manager/tabs/DriversTab.tsx` kısmında `ApiVehicle` türünden beklenen ancak aslında `brandModel` şeklinde birleşik barındırılan model/marka yapısı nedeniyle alınan "Property does not exist" hatası `{v.brandModel || "Bilinmiyor"}` yapısına çevrilerek çözümlendi.

**7. Dashboard (Pano) Kısımları İçin Canlı/Anlık Yenileme (Polling)**
- **İhtiyaç:** Hocanın isteği doğrultusunda "dashboard gibi olan kısımların doğru ve anlık olarak yenilenmesi" gerekiyordu. Mevcut durumda panolardaki veriler (`DashboardTab.tsx` bileşenleri) sadece sayfa açıldığında veya sekme değiştirildiğinde bir kez yükleniyordu.
- **Çözüm:** Hem `manager` (Şirket Yöneticisi) hem de `system-admin` (Sistem Yöneticisi) panellerindeki `DashboardTab.tsx` dosyaları içerisindeki veri çekme kısımları (`useEffect` blokları) yeniden düzenlendi.
- Bütün asenkron API/fetch uç noktalarına tarayıcı belleğindeki bayat veriyi (cache) getirmemesi için `{ cache: "no-store" }` ibareleri eklendi.
- Veri çekme mantığı `fetchData` isimli tek bir fonksiyona bağlanıp `setInterval` komutu ile **her 3 saniyede bir tetiklenecek** şekilde ayarlandı. 
- Bu sayede arka planda veya diğer pencerelerde yapılan ekleme/güncelleme işlemleri (örneğin yeni şoför eklenmesi, araç sefere çıkması vb.) anında canlı pano (Dashboard) grafiklerine ve sayaçlarına yansıyacaktır.
- **Ek Düzeltme:** Şirket panosundaki "Şoför Puanları" listesinde, şoförler işi olmadığında ("Idle") yanlışlıkla "Pasif" yazmasına neden olan koşul düzeltildi ve "Boşta" olarak revize edildi ("Pasif" etiketi sadece kullanılamaz durumdaki araç/şoförlere uygulandı).

**8. Global İsim ve Soyisim Tekilliği (Uniqueness) Doğrulaması**
- **İhtiyaç:** Sistemde aynı isim ve soyisme sahip kişilerin (farklı TC numarasına veya farklı şirketlere sahip olsalar dahi) sisteme birden fazla kez kaydedilememesi ve çakışma (conflict) engellenmesi istendi.
- **Çözüm:** `handleSave` (Kayıt) işlemleri sırasında, hem System Admin hem de Manager panellerindeki `UsersTab.tsx` ve `DriversTab.tsx` dosyalarına global kullanıcı çakışma kontrolü eklendi.
- Kullanıcı formu gönderilmeden önce sistemdeki tüm kullanıcılar `fetch("/api/User")` ile çekilerek, yeni girilen `firstName` ve `lastName` değerleri (büyük/küçük harf ve boşluklar temizlenerek) sistemdekilerle karşılaştırıldı.
- Eğer eşleşen bir kayıt varsa kayıt işlemi engellenip kullanıcıya *"Bu isim ve soyisimde bir kişi sistemde zaten kayıtlı. Farklı şirketlerde olsalar bile aynı ismi kullanamazsınız."* şeklinde anında geri bildirim (`toast.error`) gösterildi.

**9. Ehliyet (License) API Entegrasyonu ile 400 Bad Request Çözümü**
- **İhtiyaç:** Backend'e eklenen Ehliyet doğrulama kısıtlaması nedeniyle sürücü eklenirken `400 Bad Request (Geçersiz Ehliyet Numarası)` hatası alınıyordu. Sürücüden önce ehliyetin DB'de mevcut olması gerekiyordu.
- **Çözüm:** `manager/tabs/DriversTab.tsx` ve `system-admin/tabs/DriversTab.tsx` dosyalarındaki kayıt metodları modifiye edildi. Asıl Sürücü (`POST /api/Drivers`) isteğinden hemen önce, formdaki Ehliyet No alınarak `POST /api/v1/licenses` uç noktasına ehliyet oluşturma isteği (varsayılan "B" sınıfı ile) eklendi. Böylece sürücü ekleme hatasız hale getirildi.

**10. Yöneticiler (Managers) CRUD Bağlantısı**
- **İhtiyaç:** Backend tarafında `Managers` tablosu CRUD işlemleri tamamlandığı için Yöneticilerin sadece sisteme Login (User) nesnesi olarak değil, aynı zamanda Manager nesnesi olarak da kaydedilmesi istendi.
- **Çözüm:** `manager/tabs/UsersTab.tsx` ve `system-admin/tabs/UsersTab.tsx` dosyalarında `role: 1` (Yönetici) kimliğiyle kullanıcı eklendiğinde, paralel olarak `POST /api/v1/managers` isteği atılarak ("Merkez" departmanı, "101" nolu ofis varsayılan değerleriyle) gerçek Yönetici Entities'i sisteme entegre edildi.

**11. Polling Yerine Gerçek Zamanlı SignalR (WebSocket) Geçişi**
- **İhtiyaç:** Dashboard sayfalarının (`Manager` ve `System Admin`) 3 saniyede bir manuel (`setInterval`) yenilenmesi (Polling) yerine, Hocanın isteği üzerine WebSocket teknolojisine geçilmesi gerekiyordu.
- **Çözüm:** Frontend projesine `@microsoft/signalr` kütüphanesi kuruldu. `DashboardTab.tsx` sayfalarındaki `setInterval` (Polling) kodları kaldırılarak yerine `HubConnectionBuilder` vasıtasıyla `http://mikbalceyhan.me/fleetHub` adresine WebSocket üzerinden bağlanan bir akış yazıldı. Backend'den gelecek `"ReceiveUpdate"` veya `"UpdateVehicleStatus"` event'leri dinlenerek, Dashboard veri grafikleri sadece sistemde veri güncellendiğinde sıfır gecikme ile "gerçek zamanlı" yenilenecek şekilde modernize edildi.

**12. Canlı Harita Animasyonu ve OSRM Rota Entegrasyonu**
- **İhtiyaç:** Haritalar üzerinde (`Manager` ve `System Admin` Dashboard'larında) sadece statik bir başlangıç noktasında bekleyen "Pin" ikonlarının, sefer süresi boyunca gerçekçi bir şoför simülasyonu gibi haritadaki yolları izleyerek varış noktasına doğru hareket etmesi istendi.
- **Çözüm:** 
  - Sıradan pin marker'ları yerine Leaflet `divIcon` kullanılarak estetik ve dikkat çekici bir "Kargo Aracı" (🚚) ikonuna dönüştürüldü.
  - Açık Kaynak Rota Makinesi (OSRM - Open Source Routing Machine) API'sine entegre olundu. Seferdeki aracın başlangıç ve bitiş koordinatları hesaplanıp gönderilerek, aradaki **gerçek yol ve sokak kıvrımlarını (geometry)** takip eden güzergâh koordinatları (GeoJSON array) çekildi.
  - Sistem panelleri içine saniyede bir tetiklenen (`setInterval`) canlı bir simülasyon döngüsü (Live Simulation Loop) kuruldu ve sefer süresi (`startTime`) baz alınarak aracın harita üzerindeki matematiksel konumu belirlendi.
  - Böylece araçlar düz bir çizgide gitmek yerine, sokak dönüşlerini (kıvrımları) takip ederek akıcı (smooth) bir şekilde hedeflerine doğru canlandırıldı.

Bu değişiklikler proje bütününde senkronizasyon ve veri tutarlılığını sağlamıştır.

**13. Toaster (Görsel Bildirim) Hatalarının Giderilmesi**
- **İhtiyaç:** Kullanıcı geçersiz bir işlem yaptığında form kapanmıyor, ancak alınan arka plan uyuşmazlığı hatası (örn. eksik konum) görsel olarak gösterilmediği için tıklama eylemi boşluğa düşmüş hissi veriyordu.
- **Çözüm:** `App.tsx` bileşeni (temel React ağacı) kontrol edildi ve `sonner` kütüphanesine ait `<Toaster />` bileşeninin sayfa iskeletine entegre edilmediği tespit edildi. Uygulamanın kök seviyesine entegre edilerek, başarı ve uyarı bildirimlerinin (pop-up'ların) tekrar güvenilir şekilde ekranın köşesinden fırlatılması ve kullanıcının eylemlerinden haberdar olması sağlandı.

**14. Harita Simülasyonunda "Anında Hedefe Işınlanma" Hatasının Çözümü**
- **İhtiyaç:** Simüle edilen kargo araçlarının saniyeler içinde anında (%100) başlangıçtan bitişe (örneğin Ankara'ya) ışınlanması haritada takip imkânını kısıtlıyordu.
- **Çözüm:** 
  - Haritanın varsayılan matematik simülasyonu 10 dakikadan (600,000 ms), **2 Saate (7,200,000 ms)** çıkarıldı.
  - Saat dilimi farklarını ve eski tarihli seferleri izole etmek amacıyla simülasyon algoritmasında **modulo mekanizması (`elapsed % DUR`)** kurgulandı. Böylelikle arayüze ilk bakıldığı anda, aracın her halükarda pürüssüz bir şekilde ve uzun bir yolculuk hızında (yavaş yavaş) animasyon gerçekleştirmesi garantilendi.
  - Bu görsel iyileştirme hem **Sistem Yöneticisi** hem de **Firma Yöneticisi** panolarındaki (Dashboard) Küresel/Aktif haritalara yaygınlaştırıldı.

**15. Operasyon Konumları (Locations) Sayfasına Canlı Araç Entegrasyonu**
- **İhtiyaç:** Şirket yöneticilerinin aktif seferleri sadece "Dashboard" ana sayfasından değil, operasyon konumlarını haritada inceledikleri **Konumlar** (`LocationsTab.tsx`) sayfasında da detaylıca izleyebilmesi gerekiyordu.
- **Çözüm:** Dashboard'ta uygulanan OSRM bazlı rota simülatörü ve özel kargo aracı (🚚) konsepti, Konumlar sayfasındaki `MapContainer`'ın içerisine başarılı bir şekilde nakledildi. Böylece yöneticilerin hem boş depo koordinatlarını görmeleri hem de hat üzerinde devriye gezen tırları yavaş simülasyon mantığıyla izleyebilmeleri sağlandı.

**16. Şoför Ekleme İşlemindeki "500 Internal Server Error" Nedeninin Bulunması ve Çözümü**
- **İhtiyaç:** Manager panelinden yeni bir Şoför kaydedilirken sistemin aniden **500 Server Error** vererek çökmesi işlemi engelliyordu.
- **Çözüm:** 
  - Yapılan teknik analizde Backend'e gönderilen `parentManagerId` değişkeninin rastgele bir `User.Id` olduğu, ancak Backend veritabanının `Manager` tablosundaki bir kimlik (`Manager.Id`) aradığı için Foreign Key kuralını çiğnediği ve veritabanı kilitlenmesi yaşadığı (Exception fırlattığı) tespit edildi.
  - Arayüz kodundaki (Frontend) ilgili açılır kutunun (Yönetici Seçimi) veri kaynağı revize edilerek doğrudan yeni kurulan `GET /api/v1/managers` endpoint'ine bağlandı. Bu sayede forma sadece geçerli ve gerçek Manager kayıtları aktarıldı, şoförler veritabanına çökmeye sebep olmadan tamamen temiz şekilde işlenmeye başlandı. (Böylece Önce Ehliyet gönderen yapı %100 istikrarlı hale geldi.)

**17. Manager ve System Admin Panelleri Arasında Veri Yapısı Senkronizasyonu (21.04.2026)**
- **İhtiyaç:** `Manager` ve `System Admin` panellerindeki kullanıcı yönetim ekranlarında, `managerId`, `departmentName` ve `officeNumber` gibi alanlar arasındaki uyumsuzluklar TypeScript hatalarına ve veri kaybına neden oluyordu. Ayrıca şoför eklerken tüm sistem yöneticilerinin listelenmesi karmaşaya yol açıyordu.
- **Çözüm:** 
  - `DriversTab.tsx` içerisindeki `ApiUser` arayüzü (interface) merkezi bir yapıya kavuşturuldu ve Manager-spesifik alanlar (`managerId`, `departmentName`, `officeNumber`) arayüze eklendi.
  - `UsersTab.tsx` dosyaları (hem Manager hem System Admin) bu merkezi arayüzü kullanacak şekilde güncellendi ve lokal tanımlamalar temizlendi.
  - **Filtreleme İyileştirmesi:** Şoför ekleme/düzenleme formundaki "Bağlı Yönetici" dropdown menüsü, şoförün ait olduğu **Şirket ID (`companyId`)** ile filtrelendi. Böylece bir şirketin şoförüne başka bir şirketin yöneticisinin atanması engellendi.
  - `getInitialForm` ve form state yönetimleri, yeni Manager alanlarını (`departmentName`, `officeNumber`) kapsayacak şekilde modernize edildi.
