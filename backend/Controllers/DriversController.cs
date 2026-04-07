using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
    public class DriversController : ControllerBase
    {
        private readonly IDriverService _driverService;

        public DriversController(IDriverService driverService)
        {
            _driverService = driverService;
        }

        [HttpGet("{id}/performance")]
        public async Task<IActionResult> GetDriverPerformance(int id)
        {
            try
            {
                var performance = await _driverService.GetDriverPerformanceAsync(id);
                return Ok(performance);
            }
            catch (Exception ex)
            {
                if (ex.Message == "Driver not found")
                {
                    return NotFound(new { message = ex.Message });
                }
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
