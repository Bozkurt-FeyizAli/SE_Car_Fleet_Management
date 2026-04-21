namespace Backend.DTOs
{
    public class DriverRequest
    {
        public int UserId { get; set; }
        public string? VehiclePlate { get; set; }
        public string LicenseNumber { get; set; } = string.Empty;
        public int Points { get; set; } = 100;
        public string Status { get; set; } = "Idle";
    }
}
