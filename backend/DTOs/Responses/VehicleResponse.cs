using Backend.Models;

namespace Backend.DTOs
{
    public class VehicleResponse
    {
        public uint Id { get; set; }
        public string PlateNumber { get; set; }
        public string? RegistrationNumber { get; set; }
        public string BrandModel { get; set; }
        public int Year { get; set; }
        public string VehicleType { get; set; }
        public decimal CapacityKg { get; set; }
        public decimal BaseRentPrice { get; set; }
        public DateTime? InsuranceStartDate { get; set; }
        public DateTime? InsuranceEndDate { get; set; }
        public DateTime? CascoStartDate { get; set; }
        public DateTime? CascoEndDate { get; set; }
        public DateTime? InspectionStartDate { get; set; }
        public DateTime? InspectionEndDate { get; set; }
        public int NextMaintenanceKm { get; set; }
        public bool IsActive { get; set; }

        public VehicleResponse(Vehicle vehicle)
        {
            Id = vehicle.Id;
            PlateNumber = vehicle.PlateNumber;
            RegistrationNumber = vehicle.RegistrationNumber;
            BrandModel = vehicle.BrandModel;
            Year = vehicle.Year;
            VehicleType = vehicle.VehicleType;
            CapacityKg = vehicle.CapacityKg;
            BaseRentPrice = vehicle.BaseRentPrice;
            InsuranceStartDate = vehicle.InsuranceStartDate;
            InsuranceEndDate = vehicle.InsuranceEndDate;
            CascoStartDate = vehicle.CascoStartDate;
            CascoEndDate = vehicle.CascoEndDate;
            InspectionStartDate = vehicle.InspectionStartDate;
            InspectionEndDate = vehicle.InspectionEndDate;
            NextMaintenanceKm = vehicle.NextMaintenanceKm;
            IsActive = vehicle.IsActive;
        }
    }
}