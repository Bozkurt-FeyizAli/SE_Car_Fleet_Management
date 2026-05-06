using Backend.Models;

namespace Backend.DTOs
{
    public class DepartmentResponse
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;

        public DepartmentResponse() { }

        public DepartmentResponse(Department department)
        {
            Id = department.Id;
            CompanyId = department.CompanyId;
            DepartmentName = department.DepartmentName;
        }
    }
}
