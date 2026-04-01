using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleResponse>> GetAllVehiclesAsync();
        Task<VehicleResponse?> GetVehicleByIdAsync(string plate);
        Task<VehicleResponse> CreateVehicleAsync(VehicleRequest request);
        Task<bool> UpdateVehicleAsync(string plate, VehicleRequest request);
        Task<bool> DeleteVehicleAsync(string plate);
        Task<IEnumerable<VehicleResponse>> GetAvailableVehiclesAsync(int companyId, string? type, int? minCapacity);
        Task<PriceCalculationResponse?> CalculatePriceAsync(string plate, int days);
    }
}