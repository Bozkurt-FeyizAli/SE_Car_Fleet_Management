using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("DriverLicense")]
    public class DriverLicense
    {
        [Key]
        [Column("ehliyet_numarasi")]
        [StringLength(20)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        [Column("ehliyet_tipi")]
        [StringLength(10)]
        public string LicenseType { get; set; } = string.Empty;

        public ICollection<Driver> Drivers { get; set; } = new List<Driver>();
    }
}
