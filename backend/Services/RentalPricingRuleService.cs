using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class RentalPricingRuleService : IRentalPricingRuleService
    {
        private readonly AppDbContext _context;

        public RentalPricingRuleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RentalPricingRuleResponse>> GetAllAsync()
        {
            var entities = await _context.RentalPricingRules.ToListAsync();
            return entities.Select(entity => new RentalPricingRuleResponse
            {
                Id = entity.Id,
                ParameterName = entity.ParameterName,
                Value = entity.Value
            });
        }

        public async Task<RentalPricingRuleResponse> GetByIdAsync(int id)
        {
            var entity = await _context.RentalPricingRules.FindAsync(id);
            if (entity == null) return null;

            return new RentalPricingRuleResponse
            {
                Id = entity.Id,
                ParameterName = entity.ParameterName,
                Value = entity.Value
            };
        }

        public async Task<RentalPricingRuleResponse> CreateAsync(RentalPricingRuleRequest request)
        {
            var entity = new RentalPricingRule
            {
                ParameterName = request.ParameterName,
                Value = request.Value
            };

            _context.RentalPricingRules.Add(entity);
            await _context.SaveChangesAsync();

            return new RentalPricingRuleResponse
            {
                Id = entity.Id,
                ParameterName = entity.ParameterName,
                Value = entity.Value
            };
        }

        public async Task<bool> UpdateAsync(int id, RentalPricingRuleRequest request)
        {
            var entity = await _context.RentalPricingRules.FindAsync(id);
            if (entity == null) return false;

                        entity.ParameterName = request.ParameterName;
            entity.Value = request.Value;

            _context.RentalPricingRules.Update(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.RentalPricingRules.FindAsync(id);
            if (entity == null) return false;

            _context.RentalPricingRules.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
