using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Departments")]
    public class Department
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [ForeignKey("CompanyId")]
        public Company Company { get; set; } = null!;

        public List<Manager> Managers { get; set; } = new();
        public List<DepartmentPermission> DepartmentPermissions { get; set; } = new();
    }
}
