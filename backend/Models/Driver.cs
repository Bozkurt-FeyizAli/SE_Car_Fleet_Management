using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Driver")]
    public class Driver
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("userID")]
        public int UserId { get; set; }

        [Column("arac_ID")]
        [StringLength(20)]
        public string? VehiclePlate { get; set; }

        [Required]
        [Column("ehliyet_ID")]
        [StringLength(20)]
        public string DriverLicenseId { get; set; } = string.Empty;

        [Column("puan")]
        public int Score { get; set; } = 100;

        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "Boşta";

        public User? User { get; set; }
        
        public Vehicle? Vehicle { get; set; }
        
        public DriverLicense? DriverLicense { get; set; }
    }
}
