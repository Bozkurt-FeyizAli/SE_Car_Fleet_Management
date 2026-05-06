using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface IPermissionService
    {
        Task<IEnumerable<PermissionResponse>> GetAllAsync();
        Task<PermissionResponse> GetByIdAsync(int id);
        Task<PermissionResponse> CreateAsync(PermissionRequest request);
        Task<bool> UpdateAsync(int id, PermissionRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
