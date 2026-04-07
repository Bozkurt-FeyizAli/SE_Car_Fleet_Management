namespace Backend.DTOs.Responses
{
    public class TripResponse
    {
        public int Id { get; set; }
        public int DriverId { get; set; }
        public string VehiclePlate { get; set; } = string.Empty;
        public int StartLocationId { get; set; }
        public int EndLocationId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal StartKm { get; set; }
        public decimal? EndKm { get; set; }
        public decimal TotalFee { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? WarningMessage { get; set; }
    }
}
