using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class License
    {
        [Key]
        [MaxLength(20)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string LicenseType { get; set; } = string.Empty;
    }
}
