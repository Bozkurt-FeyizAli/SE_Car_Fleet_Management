using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IDriverService
    {
        Task<IEnumerable<DriverResponse>> GetAllDriversAsync();
        Task<DriverResponse?> GetDriverByIdAsync(int id);
        Task<DriverResponse> CreateDriverAsync(DriverRequest request);
        Task<bool> UpdateDriverAsync(int id, DriverRequest request);
        Task<bool> DeleteDriverAsync(int id);
        Task<object> GetDriverPerformanceAsync(int driverId);
    }
}
