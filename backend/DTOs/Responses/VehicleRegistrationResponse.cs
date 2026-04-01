using Backend.Models;

namespace Backend.DTOs
{
    public class VehicleRegistrationResponse
    {
        public string RegistrationNumber { get; set; }
        public string BrandModel { get; set; }
        public int Year { get; set; }
        public string Type { get; set; }
        public int Capacity { get; set; }

        public VehicleRegistrationResponse(VehicleRegistration registration)
        {
            RegistrationNumber = registration.RegistrationNumber;
            BrandModel = registration.BrandModel;
            Year = registration.Year;
            Type = registration.Type;
            Capacity = registration.Capacity;
        }
    }
}
