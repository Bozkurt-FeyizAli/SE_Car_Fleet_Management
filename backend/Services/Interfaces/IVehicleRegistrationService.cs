using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IVehicleRegistrationService
    {
        Task<IEnumerable<VehicleRegistrationResponse>> GetAllRegistrationsAsync();
        Task<VehicleRegistrationResponse?> GetRegistrationByIdAsync(string registrationNumber);
        Task<VehicleRegistrationResponse> CreateRegistrationAsync(VehicleRegistrationRequest request);
        Task<bool> UpdateRegistrationAsync(string registrationNumber, VehicleRegistrationRequest request);
        Task<bool> DeleteRegistrationAsync(string registrationNumber);
    }
}
