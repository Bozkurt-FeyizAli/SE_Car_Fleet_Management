namespace Backend.DTOs.Requests
{
    public class AddressRequest
    {
        public string City { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string FullAddress { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
    }
}
