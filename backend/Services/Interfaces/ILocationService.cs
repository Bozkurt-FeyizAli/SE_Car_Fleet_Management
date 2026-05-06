using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface ILocationService
    {
        Task<LocationResponse> AddLocationAsync(LocationRequest request);
        Task<IEnumerable<LocationResponse>> GetLocationsByCompanyAsync(int companyId);
        Task<IEnumerable<LocationResponse>> GetAllLocationsAsync();
        Task<LocationResponse?> GetLocationByIdAsync(int id);
        Task<bool> UpdateLocationAsync(int id, LocationRequest request);
        Task<bool> DeleteLocationAsync(int id);
    }
}
