using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("roles")]
    public class Role
    {
        [Key]
        [Column("id")]
        public uint Id { get; set; }

        [Required]
        [Column("role_name")]
        [EnumDataType(typeof(UserRole))]
        public UserRole RoleName { get; set; }

        // Navigation property for users with this role
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
