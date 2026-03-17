Filo Yönetim Sistemi – Şoför Veritabanı Şeması

Driver (Şoför)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
DriverID	INT	Primary Key, Auto Increment
UserID	INT	Foreign Key (Users)
DepartmentID	INT	Foreign Key (Departments)
FirstName	VARCHAR(50)	Şoförün adı
LastName	VARCHAR(50)	Şoförün soyadı
Phone	VARCHAR(20)	Telefon numarası
IdentityNumber	VARCHAR(11)	T.C. Kimlik No (Unique)
HireDate	DATE	İşe giriş tarihi
CurrentScore	DECIMAL(5,2)	Anlık sürücü puanı (100 üzerinden)
Status	ENUM	Active, OnTrip, OffDuty


LicenseTypes (Ehliyet Tipleri)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
LicenseTypeID	INT	Primary Key
LicenseCode	VARCHAR(10)	Ehliyet sınıfı (B, C, D, G vb.)


DriverLicence (Şoför Ehliyeti)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
DriverID	INT	Foreign Key (Drivers)
LicenseTypeID	INT	Foreign Key (LicenseTypes)
ExpiryDate	DATE	Ehliyet son kullanma tarihi


Vehicle (Araç)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
VehicleID	INT	Primary Key, Auto Increment
CompanyID	INT	Foreign Key (Companies)
PlateNumber	VARCHAR(20)	Plaka (Unique)
Brand	VARCHAR(50)	Marka
Model	VARCHAR(50)	Model
CurrentDriverID	INT	Foreign Key (Drivers) - Atanmış şoför


Trips (Seferler)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
TripID	INT	Primary Key, Auto Increment
DriverID	INT	Foreign Key (Drivers)
VehicleID	INT	Foreign Key (Vehicles)
DepartureLocation	VARCHAR(255)	Kalkış noktası
ArrivalLocation	VARCHAR(255)	Varış noktası
StartTime	DATETIME	Sefer başlangıç zamanı
EndTime	DATETIME	Sefer bitiş zamanı
DistanceTraveled	DECIMAL(10,2)	Kat edilen mesafe (KM)


DriverScores (Puanlama Geçmişi)
Sütun Adı	Veri Tipi	Açıklama / Kısıtlama
ScoreID	INT	Primary Key, Auto Increment
DriverID	INT	Foreign Key (Drivers)
TripID	INT	Foreign Key (Trips)
ScoreValue	INT	Sürüş puanı (Örn: 0-100)
Comment	TEXT	Değerlendirme notu
CreatedAt	TIMESTAMP	İşlem tarihi

