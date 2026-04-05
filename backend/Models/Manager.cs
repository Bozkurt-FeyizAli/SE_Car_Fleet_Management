using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    public class Manager
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? OfficeNumber { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        public List<ManagerPermission> Permissions { get; set; } = new();
    }
}
