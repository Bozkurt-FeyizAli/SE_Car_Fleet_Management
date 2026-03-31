using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("Rental")]
    public class Rental
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("arac_plaka")]
        [StringLength(20)]
        public string VehiclePlate { get; set; } = string.Empty;

        [Required]
        [Column("kiralayan_sirket_id")]
        public int RenterCompanyId { get; set; }

        [Required]
        [Column("baslangic_tarihi")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("bitis_tarihi")]
        public DateTime EndDate { get; set; }

        [Required]
        [Column("kira_anindaki_km", TypeName = "decimal(10,2)")]
        public decimal RentStartKm { get; set; }

        [Column("iade_tarihi")]
        public DateTime? ReturnDate { get; set; }

        [Column("toplam_ucret", TypeName = "decimal(12,2)")]
        public decimal? TotalPrice { get; set; }

        public Vehicle? Vehicle { get; set; }
        public Company? RenterCompany { get; set; }
    }
}
