using Backend.DTOs.Requests;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentalPricingRuleController : ControllerBase
    {
        private readonly IRentalPricingRuleService _rentalPricingRuleService;

        public RentalPricingRuleController(IRentalPricingRuleService rentalPricingRuleService)
        {
            _rentalPricingRuleService = rentalPricingRuleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _rentalPricingRuleService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _rentalPricingRuleService.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RentalPricingRuleRequest request)
        {
            var result = await _rentalPricingRuleService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RentalPricingRuleRequest request)
        {
            var success = await _rentalPricingRuleService.UpdateAsync(id, request);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _rentalPricingRuleService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
