using Backend.Models;

namespace Backend.Services.Interfaces
{
    public interface IManagerService
    {
        Task<IEnumerable<Permission>> GetManagerPermissionsAsync(int managerId);
    }
}
