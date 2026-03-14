using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserResponse>> GetAllUsersAsync();
        Task<UserResponse?> GetUserByIdAsync(uint id);
        Task<UserResponse> CreateUserAsync(UserRequest request);
        Task<bool> UpdateUserAsync(uint id, UserRequest request);
        Task<bool> DeleteUserAsync(uint id);
    }
}