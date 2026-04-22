namespace Backend.DTOs.Requests
{
    public class LocationRequest
    {
        public int CompanyId { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public AddressRequest Address { get; set; } = null!;
    }
}
