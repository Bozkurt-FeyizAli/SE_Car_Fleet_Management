using Backend.Models;

namespace Backend.DTOs
{
    public class VehicleResponse
    {
        public string Plate { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public decimal CurrentKm { get; set; }
        public decimal BaseRentPrice { get; set; }
        public DateTime InsuranceEndDate { get; set; }
        public DateTime CascoEndDate { get; set; }
        public DateTime InspectionEndDate { get; set; }
        public int NextMaintenanceKm { get; set; }
        public bool IsActive { get; set; }
        public int CompanyId { get; set; }

        public VehicleResponse() { }

        public VehicleResponse(Vehicle vehicle)
        {
            Plate = vehicle.Plate;
            RegistrationNumber = vehicle.RegistrationNumber;
            CurrentKm = vehicle.CurrentKm;
            BaseRentPrice = vehicle.BaseRentPrice;
            InsuranceEndDate = vehicle.InsuranceEndDate;
            CascoEndDate = vehicle.CascoEndDate;
            InspectionEndDate = vehicle.InspectionEndDate;
            NextMaintenanceKm = vehicle.NextMaintenanceKm;
            IsActive = vehicle.IsActive;
            CompanyId = vehicle.CompanyId;
        }
    }
}
