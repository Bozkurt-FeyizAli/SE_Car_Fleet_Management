using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserResponse>> GetAllUsersAsync()
        {
            var users = await _context.Users.ToListAsync();
            return users.Select(u => new UserResponse(u));
        }

        public async Task<UserResponse?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;
            return new UserResponse(user);
        }

        public async Task<UserResponse> CreateUserAsync(UserRequest request)
        {
            var user = new User
            {
                CompanyId = request.CompanyId,
                ParentManagerId = request.ParentManagerId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = HashIfNeeded(request.PasswordHash),
                PhoneNumber = request.PhoneNumber,
                TcIdentityNumber = request.TcIdentityNumber,
                CriminalRecord = request.CriminalRecord,
                Role = (UserRole)request.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserResponse(user);
        }

        public async Task<bool> UpdateUserAsync(int id, UserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.CompanyId = request.CompanyId;
            user.ParentManagerId = request.ParentManagerId;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            if (!string.IsNullOrWhiteSpace(request.PasswordHash))
            {
                user.PasswordHash = HashIfNeeded(request.PasswordHash);
            }
            user.PhoneNumber = request.PhoneNumber;
            user.TcIdentityNumber = request.TcIdentityNumber;
            user.CriminalRecord = request.CriminalRecord;
            user.Role = (UserRole)request.Role;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        private static string HashIfNeeded(string passwordOrHash)
        {
            if (string.IsNullOrWhiteSpace(passwordOrHash))
            {
                throw new ArgumentException("Password cannot be empty.");
            }

            if (passwordOrHash.StartsWith("$2a$") || passwordOrHash.StartsWith("$2b$") || passwordOrHash.StartsWith("$2y$"))
            {
                return passwordOrHash;
            }

            return BCrypt.Net.BCrypt.HashPassword(passwordOrHash);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}