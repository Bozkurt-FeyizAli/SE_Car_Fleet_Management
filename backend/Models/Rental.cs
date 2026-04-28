using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Rental
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string VehiclePlate { get; set; } = string.Empty;

        [Required]
        public int RenterCompanyId { get; set; }

        [Required]
        public int RentedCompanyId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal RentStartKm { get; set; }

        public DateTime? ReturnDate { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal? TotalPrice { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [Required]
        public bool IsCompleted { get; set; } = false;

        [ForeignKey("VehiclePlate")]
        public Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("RenterCompanyId")]
        public Company RenterCompany { get; set; } = null!;

        [ForeignKey("RentedCompanyId")]
        public Company RentedCompany { get; set; } = null!;
    }
}
