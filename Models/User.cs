using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public uint Id { get; set; }

        [Column("company_id")]
        public uint? CompanyId { get; set; }

        [Required]
        [Column("role_id")]
        public uint RoleId { get; set; }

        [Column("parent_user_id")]
        public uint? ParentUserId { get; set; }

        [Required]
        [Column("first_name")]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [Column("last_name")]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "active";

        [Column("driver_license_id")]
        [StringLength(50)]
        public string? DriverLicenseId { get; set; }

        [Column("driver_expiry_date")]
        public DateTime? DriverExpiryDate { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("RoleId")]
        public Role? Role { get; set; }

        [ForeignKey("ParentUserId")]
        public User? ParentUser { get; set; }
        
        public ICollection<User> ChildUsers { get; set; } = new List<User>();
    }
}
