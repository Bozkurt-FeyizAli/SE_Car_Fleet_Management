namespace Backend.DTOs
{
    public class ManagerRequest
    {
        public int UserId { get; set; }
        public int DepartmentId { get; set; }
        public string? OfficeNumber { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
}
