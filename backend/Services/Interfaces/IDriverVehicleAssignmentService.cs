using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface IDriverVehicleAssignmentService
    {
        Task<IEnumerable<DriverVehicleAssignmentResponse>> GetAllAsync();
        Task<DriverVehicleAssignmentResponse> GetByIdAsync(int id);
        Task<DriverVehicleAssignmentResponse> CreateAsync(DriverVehicleAssignmentRequest request);
        Task<bool> UpdateAsync(int id, DriverVehicleAssignmentRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
