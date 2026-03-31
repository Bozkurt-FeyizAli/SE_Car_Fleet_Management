using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Companies")]
    public class Company
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("sirket_adi")]
        [StringLength(100)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [Column("vergi_no")]
        [StringLength(20)]
        public string TaxNumber { get; set; } = string.Empty;

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public ICollection<Rental> RentalsAsRenter { get; set; } = new List<Rental>();
    }
}
