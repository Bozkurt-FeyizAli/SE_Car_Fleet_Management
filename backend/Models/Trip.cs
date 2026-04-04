using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Trip
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int DriverId { get; set; }

        [Required]
        [MaxLength(20)]
        public string VehiclePlate { get; set; } = string.Empty;

        [Required]
        public int StartLocationId { get; set; }

        [Required]
        public int EndLocationId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal StartKm { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? EndKm { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalFee { get; set; } = 0;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Preparing"; // 'Preparing', 'InTrip', 'Completed', 'Cancelled'

        [ForeignKey("DriverId")]
        public Driver Driver { get; set; } = null!;

        [ForeignKey("VehiclePlate")]
        public Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("StartLocationId")]
        public Location StartLocation { get; set; } = null!;

        [ForeignKey("EndLocationId")]
        public Location EndLocation { get; set; } = null!;
    }
}
