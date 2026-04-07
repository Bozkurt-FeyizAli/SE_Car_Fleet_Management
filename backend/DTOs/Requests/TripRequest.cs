namespace Backend.DTOs.Requests
{
    public class TripRequest
    {
        public int DriverId { get; set; }
        public string VehiclePlate { get; set; } = string.Empty;
        public int StartLocationId { get; set; }
        public int EndLocationId { get; set; }
    }
}
