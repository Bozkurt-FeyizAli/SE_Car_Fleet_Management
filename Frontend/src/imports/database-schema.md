1. Tablo: companies (Şirketler)
Sistemdeki tüm şirketlerin ana kayıtlarının tutulduğu tablodur. Sistem yöneticisi şirket ekleme, çıkarma ve durumlarını (aktif/pasif) yönetme işlemlerini bu tablo üzerinden yapar.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Şirketin benzersiz ID'si
name	VARCHAR(255)	NOT NULL	Şirketin resmi adı
tax_number	VARCHAR(50)	UNIQUE, NOT NULL	Vergi numarası
contact_email	VARCHAR(100)	UNIQUE	Şirket iletişim e-postası
status	ENUM	'active', 'suspended'	Şirketin sistemdeki durumu
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	Sisteme kayıt tarihi
    • Neden Var? Süper Admin'in sistemdeki çoklu şirket yapısını yönetmesi ve şirketlerin sistemdeki aktiflik durumlarını kontrol etmesi için gereklidir.
2. Tablo: users (Kullanıcılar ve Hiyerarşi)
Sisteme giriş yapan herkesin kayıtlı olduğu ana tablodur. Sistem Yöneticisi, Şirket Yöneticisi, Departman Yöneticisi ve Şoför gibi hiyerarşik yapı bu tablodaki roller ile ayrıştırılır.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Kullanıcı ID
company_id	INT	FOREIGN KEY, NULLABLE	Süper Admin için NULL, diğerleri için dolu
department_id	INT	FOREIGN KEY, NULLABLE	Departman yöneticisi/şoför için dolu
full_name	VARCHAR(150)	NOT NULL	Ad Soyad
email	VARCHAR(100)	UNIQUE, NOT NULL	Sisteme giriş e-postası
password_hash	VARCHAR(255)	NOT NULL	Şifrelenmiş parola
role	ENUM	'system_admin', 'company_admin', 'department_admin', 'driver'	Kesin yetki hiyerarşisi (RBAC) 
status	ENUM	'active', 'inactive'	Hesap durumu
    • Neden Var? Sistemdeki katı RBAC (Role-Based Access Control) hiyerarşisini uygulamak ve Süper Admin'in tüm global kullanıcıları yönetebilmesi için gereklidir.
3. Tablo: driver_profiles (Şoför Profilleri ve Puan Sistemi)
Sistemdeki şoförlerin dinamik puanlarını ve özel bilgilerini tutar. Bu tablo doğrudan araç kiralama bedellerini etkiler.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Profil ID
user_id	INT	FOREIGN KEY (users.id)	İlgili kullanıcı kaydı
license_class	VARCHAR(10)	NOT NULL	Ehliyet sınıfı
driver_score	DECIMAL(3,2)	DEFAULT 5.00	Dinamik şoför puanı 
    • Neden Var? Sistemin temel iş kurallarından biri olan "Şoför Puanına Göre Dinamik Fiyatlandırma" (Dynamic Rental Pricing) mekanizmasının çalışabilmesi için şoför puanlarının merkezi olarak tutulması zorunludur. Puan, geçmiş seferler ve kazalara göre hesaplanır.
4. Tablo: vehicles (Global Araç Havuzu)
Sistemdeki tüm şirketlere ait araçların detaylı özelliklerinin ve durumlarının tutulduğu tablodur.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Araç ID
company_id	INT	FOREIGN KEY (companies.id)	Aracın bağlı olduğu şirket
plate_number	VARCHAR(20)	UNIQUE, NOT NULL	Araç plakası
vehicle_type	ENUM	'truck', 'lorry', 'sedan', 'light commercial'	Araç tipi 
casco_expiry	DATE	NOT NULL	Kasko bitiş tarihi 
insur_expiry	DATE	NOT NULL	Sigorta bitiş tarihi 
next_maint_km	INT	NOT NULL	Sıradaki bakım kilometresi 
status	ENUM	'active', 'passive', 'rented'	Aracın anlık durumu 
base_price	DECIMAL(10,2)	NOT NULL	Şirketler arası kiralama taban fiyatı
gps_data	VARCHAR(255)	NULL	Anlık GPS verisi 
    • Neden Var? Araçların kasko, sigorta, bakım kilometresi ve GPS verisi gibi spesifik özellikleriyle birlikte merkezi sistemde listelenmesi ve kaza anında durumlarının otomatik olarak "pasif" (passive) duruma çekilebilmesi için gereklidir.
5. Tablo: inter_company_rentals (Şirketler Arası Pazar Yeri)
Şirketlerin birbirlerine araç kiralama işlemlerini ve dinamik fiyat geçmişini tutar.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Kiralama ID
owner_comp_id	INT	FOREIGN KEY (companies.id)	Aracı kiraya veren şirket
renter_comp_id	INT	FOREIGN KEY (companies.id)	Aracı kiralayan şirket
vehicle_id	INT	FOREIGN KEY (vehicles.id)	Kiralanan araç
driver_id	INT	FOREIGN KEY (users.id)	Aracı kullanacak atanan şoför
dynamic_price	DECIMAL(10,2)	NOT NULL	Şoför puanına göre hesaplanan anlık bedel 
start_date	DATETIME	NOT NULL	Kiralama başlangıç
end_date	DATETIME	NULL	Kiralama bitiş
    • Neden Var? Sistemin temel özelliği olan "Inter-Company Lending" işlevini desteklemek ve şoför puanına göre (puan düşükse kiralama bedeli artar) hesaplanan dinamik kiralama bedellerini kayıt altına almak içindir.
6. Tablo: tasks (Görevler)
Yöneticilerin şoförleri araçlara atamasıyla oluşan seferlerin tutulduğu tablodur.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Görev ID
vehicle_id	INT	FOREIGN KEY (vehicles.id)	Atanan araç 
driver_id	INT	FOREIGN KEY (users.id)	Atanan şoför 
destination	VARCHAR(255)	NOT NULL	Görev rotası (Örn: İstanbul-Ankara) 
start_km	INT	NOT NULL	Teslim alınan kilometre 
end_km	INT	NULL	Teslim edilen kilometre
status	ENUM	'assigned', 'in_progress', 'completed'	Görev durumu
    • Neden Var? Şoförlerin aktif görevlerini görebilmesi, araç teslim aldıklarında kilometre (mileage) girebilmesi ve departman hiyerarşisine uygun atamaların takip edilebilmesi için gereklidir.

8. Tablo: system_audit_logs (Sistem Denetim Kayıtları)
Süper Admin'in tüm sistemi gözetleyebilmesi için oluşturulan tarihsel kayıt tablosudur.
Sütun Adı	Veri Tipi	Kısıtlamalar	Açıklama
id	INT	PRIMARY KEY, AUTO_INCREMENT	Log ID
action_type	VARCHAR(100)	NOT NULL	İşlem tipi (trip_completed, accident, score_change)
description	TEXT	NOT NULL	Detaylı açıklama
created_at	DATETIME	DEFAULT CURRENT_TIMESTAMP	Log zamanı
    • Neden Var? SRS belgesindeki 7.1 Database Requirements maddesine göre; sistemin tamamlanan her seferi, bildirilen her kazayı ve tüm dinamik puan değişikliklerini eksiksiz bir tarihsel denetim izi (audit trail) bırakmak amacıyla kalıcı bir ilişkisel veritabanına kaydetmesi zorunludur. Süper Admin bu tablo üzerinden sistemin güvenilirliğini denetler.
