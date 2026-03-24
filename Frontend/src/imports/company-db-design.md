Şirket Modülü Veritabanı Tasarımı
1. Tablo: company (Şirket)
Şirketlerin temel bilgilerini tutar. Her şirket benzersiz bir ID ile tanımlanır.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT / BIGINT	PRIMARY KEY, AUTO_INCREMENT	Şirketin benzersiz tanımlayıcısı
name	VARCHAR(255)	NOT NULL	Şirket adı
tax_number	VARCHAR(50)	UNIQUE, NOT NULL	Vergi numarası
address	TEXT		Adres
phone	VARCHAR(20)		Telefon numarası
email	VARCHAR(100)	UNIQUE	E-posta adresi
website	VARCHAR(255)		Web sitesi
logo_url	VARCHAR(500)		Logo dosyasının yolu/URL'si
status	ENUM('active','passive','suspended')	NOT NULL DEFAULT 'active'	Şirket durumu
created_at	DATETIME	NOT NULL DEFAULT CURRENT_TIMESTAMP	Kayıt oluşturulma tarihi
updated_at	DATETIME	ON UPDATE CURRENT_TIMESTAMP	Son güncelleme tarihi

2. Tablo: company_users (Şirket Kullanıcıları)
Şirket adına sisteme giriş yapacak kişiler (şirket yöneticileri, çalışanlar). Şoförler ayrı bir tabloda tutulabilir veya burada rol alanı ile ayrılabilir. Tercihe bağlı.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Kullanıcı ID
company_id	INT	FOREIGN KEY (companies.id)	Bağlı olduğu şirket
first_name	VARCHAR(100)	NOT NULL	Adı
last_name	VARCHAR(100)	NOT NULL	Soyadı
email	VARCHAR(100)	UNIQUE, NOT NULL	E-posta (giriş için)
password_hash	VARCHAR(255)	NOT NULL	Hashlenmiş şifre
phone	VARCHAR(20)		Telefon
role	ENUM('admin','employee','driver')	NOT NULL DEFAULT 'employee'	Kullanıcının şirketteki rolü
is_active	BOOLEAN	DEFAULT TRUE	Hesap aktif mi?
last_login	DATETIME		Son giriş tarihi
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	
Not: Eğer şoförler için daha spesifik alanlar gerekiyorsa (ehliyet bilgisi, vb.) ayrı bir drivers tablosu oluşturmak daha iyi olabilir. O durumda burada role 'driver' olanlar drivers tablosunda da bir kayda sahip olur (1:1 ilişki).

3. Tablo: vehicles (Araçlar)
Şirkete ait araçlar.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Araç ID
company_id	INT	FOREIGN KEY (companies.id)	Bağlı olduğu şirket
plate	VARCHAR(20)	NOT NULL, UNIQUE	Plaka
brand	VARCHAR(50)	NOT NULL	Marka
model	VARCHAR(50)	NOT NULL	Model
year	INT		Üretim yılı
vehicle_type	ENUM('car','van','truck','motorcycle')	NOT NULL	Araç tipi
capacity_kg	DECIMAL(10,2)		Taşıma kapasitesi (kg)
status	ENUM('available','in_service','out_of_service')	DEFAULT 'available'	Araç durumu
insurance_expiry	DATE		Sigorta bitiş tarihi
inspection_expiry	DATE		Muayene bitiş tarihi
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	
updated_at	DATETIME	ON UPDATE CURRENT_TIMESTAMP	

4. Tablo: drivers (Şoförler)
Şirkette çalışan şoförlerin detaylı bilgileri.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Şoför ID
company_id	INT	FOREIGN KEY (companies.id)	Bağlı olduğu şirket
user_id	INT	FOREIGN KEY (company_users.id)	Bağlı olduğu kullanıcı hesabı (nullable) - eğer şoförün sisteme girişi varsa
first_name	VARCHAR(100)	NOT NULL	Adı
last_name	VARCHAR(100)	NOT NULL	Soyadı
license_number	VARCHAR(50)	UNIQUE, NOT NULL	Ehliyet numarası
license_class	VARCHAR(10)		Ehliyet sınıfı (B, C, D, E vb.)
phone	VARCHAR(20)		Telefon
email	VARCHAR(100)	UNIQUE	E-posta
hire_date	DATE		İşe başlama tarihi
status	ENUM('active','inactive','on_leave')	DEFAULT 'active'	Çalışma durumu
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	
updated_at	DATETIME	ON UPDATE CURRENT_TIMESTAMP	

5. Tablo: orders (Siparişler)
Müşterilerin verdiği, şirketin (veya şoförün) teslim ettiği siparişler.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT / BIGINT	PRIMARY KEY, AUTO_INCREMENT	Sipariş ID
company_id	INT	FOREIGN KEY (companies.id)	Siparişin ait olduğu şirket (hangi şirket taşıyor)
customer_id	INT	FOREIGN KEY (customers.id)	Müşteri ID (ayrı bir müşteri tablosu varsa)
driver_id	INT	FOREIGN KEY (drivers.id)	Görevli şoför (nullable)
vehicle_id	INT	FOREIGN KEY (vehicles.id)	Kullanılan araç (nullable)
order_number	VARCHAR(50)	UNIQUE, NOT NULL	Sipariş numarası (gösterimlik)
pickup_address	TEXT	NOT NULL	Alım adresi
delivery_address	TEXT	NOT NULL	Teslimat adresi
pickup_lat	DECIMAL(10,8)		Alım noktası enlem (opsiyonel)
pickup_lng	DECIMAL(11,8)		Alım noktası boylam
delivery_lat	DECIMAL(10,8)		Teslimat noktası enlem
delivery_lng	DECIMAL(11,8)		Teslimat noktası boylam
scheduled_time	DATETIME		Planlanan zaman
status	ENUM('pending','assigned','picked_up','delivered','cancelled')	NOT NULL DEFAULT 'pending'	Sipariş durumu
price	DECIMAL(10,2)		Sipariş ücreti
payment_status	ENUM('unpaid','paid','refunded')	DEFAULT 'unpaid'	Ödeme durumu
notes	TEXT		Ek notlar
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	
updated_at	DATETIME	ON UPDATE CURRENT_TIMESTAMP	
Not: Eğer müşteriler ayrı bir tabloda tutuluyorsa (customers) ona da yer verilir. Ancak sadece şirket kısmı istendiği için customers tablosunu burada detaylandırmıyorum.

6. Tablo: payments (Ödemeler)
Şirkete yapılan ödemeler (örneğin müşterilerden tahsilat) veya şirketin yaptığı ödemeler (şoför maaşları, giderler). Hangi tip olduğunu belirten bir alan eklenebilir.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Ödeme ID
company_id	INT	FOREIGN KEY (companies.id)	İlgili şirket
order_id	INT	FOREIGN KEY (orders.id)	Bağlı olduğu sipariş (nullable)
payment_type	ENUM('incoming','outgoing')	NOT NULL	Gelir mi gider mi
amount	DECIMAL(10,2)	NOT NULL	Tutar
currency	VARCHAR(3)	DEFAULT 'TRY'	Para birimi
payment_method	VARCHAR(50)		Ödeme yöntemi (kredi kartı, nakit, havale vb.)
transaction_id	VARCHAR(100)		Banka/işlem numarası
payment_date	DATETIME	NOT NULL DEFAULT CURRENT_TIMESTAMP	Ödeme tarihi
description	TEXT		Açıklama
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	


8. Tablo: company_documents (Şirket Belgeleri)
Şirketin yasal evrakları (vergi levhası, ruhsat, sigorta belgeleri vb.). Dosya yolu olarak saklanabilir.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	
company_id	INT	FOREIGN KEY (companies.id)	
document_type	VARCHAR(100)	NOT NULL	Belge tipi (vergi levhası, sigorta poliçesi vb.)
file_path	VARCHAR(500)	NOT NULL	Dosyanın sunucudaki yolu/URL'si
upload_date	DATETIME	DEFAULT CURRENT_TIMESTAMP	Yükleme tarihi
expiry_date	DATE		Belge geçerlilik bitiş tarihi (varsa)
is_verified	BOOLEAN	DEFAULT FALSE	Admin tarafından onaylandı mı?
notes	TEXT		Ek not

Tablolar Arası İlişkiler (Özet)
    • companies -> company_users: Bir şirketlerin birden çok kullanıcısı olabilir (1:N).
    • companies -> vehicles: Bir şirketlerin birden çok aracı olabilir (1:N).
    • companies -> drivers: Bir şirketlerde birden çok şoför çalışabilir (1:N).
    • companies -> orders: Bir şirketlere ait birden çok sipariş olabilir (1:N).
    • companies -> payments: Bir şirketlerin birden çok ödeme kaydı olabilir (1:N).
    • companies -> company_subscriptions: Bir şirketlerin birden çok abonelik geçmişi olabilir (1:N) (genelde son kayıt aktif).
    • companies -> company_documents: Bir şirketlerin birden çok belgesi olabilir (1:N).
    • orders -> drivers: Bir sipariş bir şoföre atanabilir (N:1).
    • orders -> vehicles: Bir sipariş bir araca atanabilir (N:1).
    • orders -> payments: Bir siparişin birden çok ödemesi olabilir (1:N) (taksit vb.).
    • drivers -> company_users (opsiyonel): Eğer şoförler sisteme giriş yapacaksa, bir şoförün bir kullanıcı hesabı olabilir (1:1).
Sistem Özellikleri (System Features) ile İlişkilendirme
Bu tablolar, şirket modülüne ait şu sistem özelliklerini destekler:
Şirket Kaydı ve Yönetimi (companies, company_documents, company_subscriptions)
    • Şirket bilgileri ekleme, düzenleme, görüntüleme
    • Şirket evraklarını yükleme, onaylama
    • Abonelik planı seçme
Araç Yönetimi (vehicles)
    • Araç ekleme, düzenleme, silme
    • Araç durumu takibi (bakım, müsaitlik)
Şoför Yönetimi (drivers, company_users)
    • Şoför ekleme, düzenleme, silme
    • Şoförlere kullanıcı hesabı tanımlama (opsiyonel)
    • Şoför durumu takibi
Sipariş Yönetimi (orders)
    • Sipariş oluşturma (müşteri tarafından veya şirket tarafından)
    • Sipariş atama (şoför, araç)
    • Sipariş durumu güncelleme
Ödeme İşlemleri (payments)
    • Sipariş bazında ödeme kaydı oluşturma
    • Gelir/gider takibi
    • Ödeme durumu güncelleme