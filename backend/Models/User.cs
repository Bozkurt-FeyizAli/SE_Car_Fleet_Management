using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("User")]
    public class User
    {
        [Key]
        [Column("userID")]
        public int Id { get; set; }

        [Column("ust_yoneticiID")]
        public int? ParentManagerId { get; set; }

        [Required]
        [Column("sirketID")]
        public int CompanyId { get; set; }

        [Required]
        [Column("isim")]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [Column("soyisim")]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("sifre")]
        [StringLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [Column("telefon")]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [Column("tc")]
        [StringLength(255)]
        public string TcIdentityNumber { get; set; } = string.Empty;

        [Required]
        [Column("sicil_kaydi")]
        public string CriminalRecord { get; set; } = string.Empty;

        // Navigation Properties
        public Manager? ParentManager { get; set; }
        public Company? Company { get; set; }
        
        // One-to-one definitions
        public Manager? ManagerProfile { get; set; }
        public Driver? DriverProfile { get; set; }
    }
}
