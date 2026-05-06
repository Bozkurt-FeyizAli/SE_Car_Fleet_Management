namespace Backend.DTOs
{
    public class DepartmentRequest
    {
        public int CompanyId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }
}
