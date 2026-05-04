namespace Backend.DTOs.Responses
{
    public class RentalPricingRuleResponse
    {
        public int Id { get; set; }
        public string ParameterName { get; set; }
        public decimal Value { get; set; }
    }
}
