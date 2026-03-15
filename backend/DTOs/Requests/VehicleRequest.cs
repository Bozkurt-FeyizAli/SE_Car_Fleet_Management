namespace Backend.DTOs
{
    public class VehicleRequest
    {
        public string PlateNumber { get; set; } = string.Empty;
        public string? RegistrationNumber { get; set; }
        public string BrandModel { get; set; } = string.Empty;
        public int Year { get; set; }
        public string VehicleType { get; set; } = string.Empty;
        public decimal CapacityKg { get; set; }
        public decimal BaseRentPrice { get; set; }
        public DateTime? InsuranceStartDate { get; set; }
        public DateTime? InsuranceEndDate { get; set; }
        public DateTime? CascoStartDate { get; set; }
        public DateTime? CascoEndDate { get; set; }
        public DateTime? InspectionStartDate { get; set; }
        public DateTime? InspectionEndDate { get; set; }
        public int NextMaintenanceKm { get; set; }
        public bool IsActive { get; set; } = true;
    }
}