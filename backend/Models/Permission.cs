using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Permission")]
    public class Permission
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("yetki_adi")]
        [StringLength(50)]
        public string ActionName { get; set; } = string.Empty;

        public ICollection<ManagerPermission> Managers { get; set; } = new List<ManagerPermission>();
    }
}
