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
        public int RentingCompanyId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal KmAtRental { get; set; }

        public DateTime? ReturnDate { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal? TotalFee { get; set; }

        [ForeignKey("VehiclePlate")]
        public Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("RentingCompanyId")]
        public Company RentingCompany { get; set; } = null!;
    }
}
