using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Driver
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [MaxLength(20)]
        public string? VehiclePlate { get; set; }

        [Required]
        [MaxLength(20)]
        public string LicenseNumber { get; set; } = string.Empty;

        public int Points { get; set; } = 100;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Idle"; // 'InTrip' or 'Idle'

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("VehiclePlate")]
        public Vehicle? Vehicle { get; set; }

        [ForeignKey("LicenseNumber")]
        public License License { get; set; } = null!;
    }
}
