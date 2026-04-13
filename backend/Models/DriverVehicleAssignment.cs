using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    /// <summary>
    /// Sürücü-Araç Eşleşmesi (14. tablo)
    /// Hangi sürücünün hangi araca atandığını tutar.
    /// </summary>
    [Table("DriverVehicleAssignments")]
    public class DriverVehicleAssignment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string VehiclePlate { get; set; } = string.Empty;

        [Required]
        public int DriverId { get; set; }

        // Navigation properties
        [ForeignKey("VehiclePlate")]
        public Vehicle Vehicle { get; set; } = null!;

        [ForeignKey("DriverId")]
        public Driver Driver { get; set; } = null!;
    }
}
