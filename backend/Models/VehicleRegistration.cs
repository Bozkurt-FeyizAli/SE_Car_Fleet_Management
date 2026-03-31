using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("VehicleRegistration")]
    public class VehicleRegistration
    {
        [Key]
        [Column("ruhsat_numarasi")]
        [StringLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [Column("marka_model")]
        [StringLength(100)]
        public string BrandModel { get; set; } = string.Empty;

        [Required]
        [Column("yil")]
        public int Year { get; set; }

        [Required]
        [Column("tip")]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [Column("kapasite")]
        public int Capacity { get; set; }

        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}
