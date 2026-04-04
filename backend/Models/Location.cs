using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Location
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        public int AddressId { get; set; }

        [Required]
        [MaxLength(100)]
        public string LocationName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(10,8)")]
        public decimal Latitude { get; set; }

        [Required]
        [Column(TypeName = "decimal(11,8)")]
        public decimal Longitude { get; set; }

        [ForeignKey("CompanyId")]
        public Company Company { get; set; } = null!;

        [ForeignKey("AddressId")]
        public Address Address { get; set; } = null!;
    }
}
