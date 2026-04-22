using Backend.Models;

namespace Backend.DTOs
{
    public class DriverResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public string? VehiclePlate { get; set; }
        public string LicenseNumber { get; set; } = string.Empty;
        public int Points { get; set; }
        public string Status { get; set; } = string.Empty;

        public DriverResponse() { }

        public DriverResponse(Driver driver)
        {
            Id = driver.Id;
            UserId = driver.UserId;
            DriverName = driver.User != null
                ? $"{driver.User.FirstName} {driver.User.LastName}"
                : string.Empty;
            VehiclePlate = driver.VehiclePlate;
            LicenseNumber = driver.LicenseNumber;
            Points = driver.Points;
            Status = driver.Status;
        }
    }
}
