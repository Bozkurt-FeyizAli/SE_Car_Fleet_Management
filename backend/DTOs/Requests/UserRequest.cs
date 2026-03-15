namespace Backend.DTOs
{
    public class UserRequest
    {
        public uint? CompanyId { get; set; }
        public uint RoleId { get; set; }
        public uint? ParentUserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // Sadece Create için
        public string? Phone { get; set; }
        public string? TcIdentityNumber { get; set; }
        public string? CriminalRecord { get; set; }

        public string? DriverLicenseId { get; set; }
        public decimal? DriverScore { get; set; }
        public string? DriverTripStatus { get; set; }
        public uint? AssignedVehicleId { get; set; }
    }
}