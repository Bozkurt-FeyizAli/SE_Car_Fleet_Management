namespace Backend.DTOs
{
    public class RentalRequest
    {
        public string VehiclePlate { get; set; } = string.Empty;
        public int RenterCompanyId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RentStartKm { get; set; }
    }
}
