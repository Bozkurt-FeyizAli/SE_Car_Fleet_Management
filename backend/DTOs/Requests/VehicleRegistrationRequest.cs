namespace Backend.DTOs
{
    public class VehicleRegistrationRequest
    {
        public string RegistrationNumber { get; set; } = string.Empty;
        public string BrandModel { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Capacity { get; set; }
    }
}
