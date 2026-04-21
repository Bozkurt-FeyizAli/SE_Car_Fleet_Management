namespace Backend.DTOs
{
    public class ManagerRequest
    {
        public int UserId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? OfficeNumber { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
}
