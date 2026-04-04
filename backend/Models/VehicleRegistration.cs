using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class VehicleRegistration
    {
        [Key]
        [MaxLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string BrandModel { get; set; } = string.Empty;

        [Required]
        public int Year { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        public int Capacity { get; set; }
    }
}
