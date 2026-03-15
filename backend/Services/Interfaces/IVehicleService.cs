using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleResponse>> GetAllVehiclesAsync();
        Task<VehicleResponse?> GetVehicleByIdAsync(uint id);
        Task<VehicleResponse> CreateVehicleAsync(VehicleRequest request);
        Task<bool> UpdateVehicleAsync(uint id, VehicleRequest request);
        Task<bool> DeleteVehicleAsync(uint id);
    }
}