using Backend.DTOs;
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

        [HttpGet]
        public async Task<IActionResult> GetAllDrivers()
        {
            var drivers = await _driverService.GetAllDriversAsync();
            return Ok(drivers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDriverById(int id)
        {
            var driver = await _driverService.GetDriverByIdAsync(id);
            if (driver == null) return NotFound();
            return Ok(driver);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDriver([FromBody] DriverRequest request)
        {
            try
            {
                var result = await _driverService.CreateDriverAsync(request);
                return CreatedAtAction(nameof(GetDriverById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDriver(int id, [FromBody] DriverRequest request)
        {
            try
            {
                var success = await _driverService.UpdateDriverAsync(id, request);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            try
            {
                var success = await _driverService.DeleteDriverAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
