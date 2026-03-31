using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("companies")]
    public class Company
    {
        [Key]
        [Column("id")]
        public uint Id { get; set; }

        [Required]
        [Column("company_name")]
        public string CompanyName { get; set; } = string.Empty;

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
