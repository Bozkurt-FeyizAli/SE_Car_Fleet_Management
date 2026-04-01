using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserResponse>> GetAllUsersAsync();
        Task<UserResponse?> GetUserByIdAsync(int id);
        Task<UserResponse> CreateUserAsync(UserRequest request);
        Task<bool> UpdateUserAsync(int id, UserRequest request);
        Task<bool> DeleteUserAsync(int id);
    }
}