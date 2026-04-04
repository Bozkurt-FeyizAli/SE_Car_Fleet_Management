using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Addresses")]
    public class Address
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string District { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Neighborhood { get; set; }

        [Required]
        public string FullAddress { get; set; } = string.Empty;

        [MaxLength(10)]
        public string? ZipCode { get; set; }
    }
}
