namespace Backend.DTOs.Responses
{
    public class LocationResponse
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int AddressId { get; set; }
        public string FullAddress { get; set; } = string.Empty;
    }
}
