using Backend.Models;

namespace Backend.DTOs
{
    public class UserResponse
    {
        public int Id { get; set; }
        public int? ParentManagerId { get; set; }
        public int CompanyId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string TcIdentityNumber { get; set; } = string.Empty;
        public string CriminalRecord { get; set; } = string.Empty;

        public UserResponse(User user)
        {
            Id = user.Id;
            ParentManagerId = user.ParentManagerId;
            CompanyId = user.CompanyId;
            FirstName = user.FirstName;
            LastName = user.LastName;
            Email = user.Email;
            PhoneNumber = user.PhoneNumber;
            TcIdentityNumber = user.TcIdentityNumber;
            CriminalRecord = user.CriminalRecord;
        }
    }
}
