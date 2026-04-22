using Backend.Models;
using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IManagerService
    {
        Task<IEnumerable<ManagerResponse>> GetAllManagersAsync();
        Task<ManagerResponse?> GetManagerByIdAsync(int id);
        Task<ManagerResponse> CreateManagerAsync(ManagerRequest request);
        Task<bool> UpdateManagerAsync(int id, ManagerRequest request);
        Task<bool> DeleteManagerAsync(int id);
        Task<IEnumerable<Permission>> GetManagerPermissionsAsync(int managerId);
    }
}
