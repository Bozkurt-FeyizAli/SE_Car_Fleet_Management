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

        public async Task<UserResponse?> GetUserByIdAsync(uint id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;
            return new UserResponse(user);
        }

        public async Task<UserResponse> CreateUserAsync(UserRequest request)
        {
            var user = new User
            {
                RoleId = request.RoleId,
                ParentUserId = request.ParentUserId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = request.PasswordHash,
                Phone = request.Phone,
                TcIdentityNumber = request.TcIdentityNumber,
                CriminalRecord = request.CriminalRecord,
                DriverLicenseId = request.DriverLicenseId,
                DriverScore = request.DriverScore,
                DriverTripStatus = request.DriverTripStatus,
                AssignedVehicleId = request.AssignedVehicleId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserResponse(user);
        }

        public async Task<bool> UpdateUserAsync(uint id, UserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.RoleId = request.RoleId;
            user.ParentUserId = request.ParentUserId;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.TcIdentityNumber = request.TcIdentityNumber;
            user.CriminalRecord = request.CriminalRecord;
            user.DriverLicenseId = request.DriverLicenseId;
            user.DriverScore = request.DriverScore;
            user.DriverTripStatus = request.DriverTripStatus;
            user.AssignedVehicleId = request.AssignedVehicleId;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(uint id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            // Soft delete
            user.IsDeleted = true;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}