using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface IRentalPricingRuleService
    {
        Task<IEnumerable<RentalPricingRuleResponse>> GetAllAsync();
        Task<RentalPricingRuleResponse> GetByIdAsync(int id);
        Task<RentalPricingRuleResponse> CreateAsync(RentalPricingRuleRequest request);
        Task<bool> UpdateAsync(int id, RentalPricingRuleRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
