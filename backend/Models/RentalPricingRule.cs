using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("RentalPricingRule")]
    public class RentalPricingRule
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("parametre_adi")]
        [StringLength(50)]
        public string ParameterName { get; set; } = string.Empty;

        [Required]
        [Column("deger", TypeName = "decimal(5,2)")]
        public decimal Value { get; set; }
    }
}
