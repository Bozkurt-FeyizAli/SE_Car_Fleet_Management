using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Manager")]
    public class Manager
    {
        [Key]
        [Column("yonetici_id")]
        public int Id { get; set; }

        [Required]
        [Column("userID")]
        public int UserId { get; set; }

        [Required]
        [Column("departman_adi")]
        [StringLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [Column("ofis_numarasi")]
        [StringLength(20)]
        public string? OfficeNumber { get; set; }

        // Navigation Property mapped by EF Core
        public User? User { get; set; }
        
        // Parent Manager relationship
        public ICollection<User> SubordinateUsers { get; set; } = new List<User>();
        public ICollection<ManagerPermission> Permissions { get; set; } = new List<ManagerPermission>();
    }
}
