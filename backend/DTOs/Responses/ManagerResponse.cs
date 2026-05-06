using Backend.Models;

namespace Backend.DTOs
{
    public class ManagerResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? OfficeNumber { get; set; }

        public ManagerResponse(Manager manager)
        {
            Id = manager.Id;
            UserId = manager.UserId;
            DepartmentId = manager.DepartmentId;
            DepartmentName = manager.Department?.DepartmentName ?? string.Empty;
            OfficeNumber = manager.OfficeNumber;
        }
    }
}
