using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("ManagerPermission")]
    public class ManagerPermission
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("yonetici_id")]
        public int ManagerId { get; set; }

        [Required]
        [Column("yetki_id")]
        public int PermissionId { get; set; }

        public Manager? Manager { get; set; }
        public Permission? Permission { get; set; }
    }
}
