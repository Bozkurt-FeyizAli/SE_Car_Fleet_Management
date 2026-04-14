using Backend.Models;

namespace Backend.DTOs
{
    public class UserResponse
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public int? ParentManagerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int Role { get; set; }

        public UserResponse() { }

        public UserResponse(User user)
        {
            Id = user.Id;
            CompanyId = user.CompanyId;
            ParentManagerId = user.ParentManagerId;
            FirstName = user.FirstName;
            LastName = user.LastName;
            Email = user.Email;
            PhoneNumber = user.PhoneNumber;
            Role = (int)user.Role;
        }
    }
}
