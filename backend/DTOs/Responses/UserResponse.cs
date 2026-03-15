using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Models;

namespace Backend.DTOs
{
    public class UserResponse
    {
        public uint Id { get; set; }
        public uint? CompanyId { get; set; }
        public uint RoleId { get; set; }
        public uint? ParentUserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? TcIdentityNumber { get; set; }
        public string? CriminalRecord { get; set; }
        public string? DriverLicenseId { get; set; }
        public decimal? DriverScore { get; set; }
        public string? DriverTripStatus { get; set; }
        public uint? AssignedVehicleId { get; set; }

        public UserResponse(User user)
        {
            Id = user.Id;
            CompanyId = user.CompanyId;
            RoleId = user.RoleId;
            ParentUserId = user.ParentUserId;
            FirstName = user.FirstName;
            LastName = user.LastName;
            Email = user.Email;
            Phone = user.Phone;
            TcIdentityNumber = user.TcIdentityNumber;
            CriminalRecord = user.CriminalRecord;
            DriverLicenseId = user.DriverLicenseId;
            DriverScore = user.DriverScore;
            DriverTripStatus = user.DriverTripStatus;
            AssignedVehicleId = user.AssignedVehicleId;
        }
    }
}

