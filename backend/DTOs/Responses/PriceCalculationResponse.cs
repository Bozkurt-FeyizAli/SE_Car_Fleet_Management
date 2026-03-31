namespace Backend.DTOs
{
    public class PriceCalculationResponse
    {
        public string VehiclePlate { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public decimal FinalPricePerDay { get; set; }
        public decimal TotalEstimatedPrice { get; set; }
    }
}
