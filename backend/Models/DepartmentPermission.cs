using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models
{
    [Table("DepartmentPermissions")]
    [PrimaryKey(nameof(DepartmentId), nameof(PermissionId))]
    public class DepartmentPermission
    {
        [Required]
        public int DepartmentId { get; set; }

        [Required]
        public int PermissionId { get; set; }

        [ForeignKey("DepartmentId")]
        public Department Department { get; set; } = null!;

        [ForeignKey("PermissionId")]
        public Permission Permission { get; set; } = null!;
    }
}
