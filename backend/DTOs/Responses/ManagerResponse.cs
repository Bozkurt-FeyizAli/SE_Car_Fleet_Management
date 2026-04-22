using Backend.Models;

namespace Backend.DTOs
{
    public class ManagerResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string DepartmentName { get; set; }
        public string? OfficeNumber { get; set; }

        public ManagerResponse(Manager manager)
        {
            Id = manager.Id;
            UserId = manager.UserId;
            DepartmentName = manager.DepartmentName;
            OfficeNumber = manager.OfficeNumber;
        }
    }
}
