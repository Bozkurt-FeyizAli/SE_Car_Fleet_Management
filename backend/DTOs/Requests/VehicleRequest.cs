namespace Backend.DTOs
{
    public class VehicleRequest
    {
        public string Plate { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public decimal CurrentKm { get; set; }
        public decimal BaseRentPrice { get; set; }
        public DateTime InsuranceEndDate { get; set; }
        public DateTime CascoEndDate { get; set; }
        public DateTime InspectionEndDate { get; set; }
        public int NextMaintenanceKm { get; set; }
        public bool IsActive { get; set; } = true;
        public int CompanyId { get; set; }
        public decimal? DamageRecordAmount { get; set; }
    }
}