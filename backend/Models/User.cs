using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public enum UserRole
{
    SistemAdmin = 0,
    Yönetici = 1,
    Sürücü = 2
}

namespace Backend.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int? ParentManagerId { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string TcIdentityNumber { get; set; } = string.Empty;

        public string? CriminalRecord { get; set; }

        [Required]
        public UserRole Role { get; set; } = UserRole.Sürücü;

        [ForeignKey("ParentManagerId")]
        public Manager? ParentManager { get; set; }

        [ForeignKey("CompanyId")]
        public Company Company { get; set; } = null!;
    }
}
