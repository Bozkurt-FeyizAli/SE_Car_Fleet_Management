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

        [Required]
        [Column("role_id")]
        public uint RoleId { get; set; }

        [Column("parent_user_id")]
        public uint? ParentUserId { get; set; } // Yönetici ID

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

        [Column("phone")]
        [StringLength(20)]
        public string? Phone { get; set; }

        [Column("tc_identity_number")]
        [StringLength(11)]
        public string? TcIdentityNumber { get; set; }

        [Column("criminal_record")]
        [StringLength(255)]
        public string? CriminalRecord { get; set; } // Sicil Kaydı

        [Column("status")]
        [StringLength(20)]
        public string Status { get; set; } = "active";

        // --- Driver Info ---
        [Column("driver_license_id")]
        [StringLength(50)]
        public string? DriverLicenseId { get; set; } // Ehliyet No

        [Column("driver_score")]
        public decimal? DriverScore { get; set; } // Sürücü Puanı

        [Column("driver_trip_status")]
        [StringLength(20)]
        public string? DriverTripStatus { get; set; } // Seferde, Müsait vb.
        
        [Column("assigned_vehicle_id")]
        public uint? AssignedVehicleId { get; set; }

        // --- Hierarchy Navigations ---
        public Role? Role { get; set; }
        
        public User? ParentUser { get; set; }
        public ICollection<User> ChildUsers { get; set; } = new List<User>();

        public Vehicle? AssignedVehicle { get; set; }

        // --- Soft Delete ---
        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;
    }
}
