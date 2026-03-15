using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("vehicles")]
    public class Vehicle
    {
        [Key]
        [Column("id")]
        public uint Id { get; set; }

        [Required]
        [Column("plate_number")]
        [StringLength(20)]
        public string PlateNumber { get; set; } = string.Empty;

        [Column("registration_number")]
        [StringLength(50)]
        public string? RegistrationNumber { get; set; }

        [Required]
        [Column("brand_model")]
        [StringLength(100)]
        public string BrandModel { get; set; } = string.Empty;

        [Column("year")]
        public int Year { get; set; }

        [Required]
        [Column("vehicle_type")]
        [StringLength(50)]
        public string VehicleType { get; set; } = string.Empty; // kamyon, ticari vs.

        [Column("capacity_kg")]
        public decimal CapacityKg { get; set; }

        [Column("base_rent_price")]
        public decimal BaseRentPrice { get; set; }

        [Column("insurance_start_date")]
        public DateTime? InsuranceStartDate { get; set; }

        [Column("insurance_end_date")]
        public DateTime? InsuranceEndDate { get; set; }

        [Column("casco_start_date")]
        public DateTime? CascoStartDate { get; set; }

        [Column("casco_end_date")]
        public DateTime? CascoEndDate { get; set; }

        [Column("inspection_start_date")]
        public DateTime? InspectionStartDate { get; set; }

        [Column("inspection_end_date")]
        public DateTime? InspectionEndDate { get; set; }

        [Column("next_maintenance_km")]
        public int NextMaintenanceKm { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false; // Soft delete flag
    }
}