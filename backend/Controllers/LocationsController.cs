using Backend.DTOs.Requests;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationsController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetLocationsByCompany(int companyId)
        {
            try
            {
                var locations = await _locationService.GetLocationsByCompanyAsync(companyId);
                return Ok(locations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddLocation([FromBody] LocationRequest request)
        {
            try
            {
                var location = await _locationService.AddLocationAsync(request);
                return CreatedAtAction(nameof(GetLocationsByCompany), new { companyId = location.CompanyId }, location);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
