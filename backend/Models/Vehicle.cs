using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Vehicle
    {
        [Key]
        [MaxLength(20)]
        public string Plate { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal CurrentKm { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal BaseRentalPrice { get; set; }

        [Required]
        public DateTime InsuranceEndDate { get; set; }

        [Required]
        public DateTime CascoEndDate { get; set; }

        [Required]
        public DateTime InspectionEndDate { get; set; }

        [Required]
        public int NextMaintenanceKm { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        public int CompanyId { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal DamageRecordAmount { get; set; }

        [ForeignKey("RegistrationNumber")]
        public VehicleRegistration Registration { get; set; } = null!;

        [ForeignKey("CompanyId")]
        public Company Company { get; set; } = null!;
    }
}
