using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface IManagerPermissionService
    {
        Task<IEnumerable<ManagerPermissionResponse>> GetAllAsync();
        Task<ManagerPermissionResponse> GetByIdAsync(int id);
        Task<ManagerPermissionResponse> CreateAsync(ManagerPermissionRequest request);
        Task<bool> UpdateAsync(int id, ManagerPermissionRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
