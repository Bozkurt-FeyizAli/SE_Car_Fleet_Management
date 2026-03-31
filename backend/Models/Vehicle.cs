using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Vehicle")]
    public class Vehicle
    {
        [Key]
        [Column("plaka")]
        [StringLength(20)]
        public string Plate { get; set; } = string.Empty;

        [Required]
        [Column("ruhsat_numarasi")]
        [StringLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [Column("anlik_kilometre", TypeName = "decimal(10,2)")]
        public decimal CurrentKm { get; set; }

        [Required]
        [Column("kiralik_base_fiyat", TypeName = "decimal(10,2)")]
        public decimal BaseRentPrice { get; set; }

        [Required]
        [Column("sigorta_bitis_tarihi")]
        public DateTime InsuranceEndDate { get; set; }

        [Required]
        [Column("kasko_bitis_tarihi")]
        public DateTime CascoEndDate { get; set; }

        [Required]
        [Column("muayene_bitis_tarihi")]
        public DateTime InspectionEndDate { get; set; }

        [Required]
        [Column("siradaki_bakim_km")]
        public int NextMaintenanceKm { get; set; }

        [Column("aktif_mi")]
        public bool IsActive { get; set; } = true;

        [Required]
        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "Müsait"; // Müsait, Kirada, Bakımda

        [Required]
        [Column("sirket_id")]
        public int CompanyId { get; set; }

        [Column("hasar_kaydi_tutari", TypeName = "decimal(12,2)")]
        public decimal? DamageRecordAmount { get; set; }

        public Company? Company { get; set; }
        public VehicleRegistration? VehicleRegistration { get; set; }
        public ICollection<Driver> AssignedDrivers { get; set; } = new List<Driver>();
        public ICollection<Rental> RentalsAsVehicle { get; set; } = new List<Rental>();
    }
}