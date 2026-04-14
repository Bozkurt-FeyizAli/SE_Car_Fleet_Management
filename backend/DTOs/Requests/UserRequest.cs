namespace Backend.DTOs
{
    public class UserRequest
    {
        public int CompanyId { get; set; }
        public int? ParentManagerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string TcIdentityNumber { get; set; } = string.Empty;
        public string? CriminalRecord { get; set; }
        public int Role { get; set; } = 3; // Default: Sürücü (3)
    }
}
