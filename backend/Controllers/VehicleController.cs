using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/vehicles")]
    public class VehicleController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;

        public VehicleController(IVehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllVehicles()
        {
            var vehicles = await _vehicleService.GetAllVehiclesAsync();
            return Ok(vehicles);
        }

        [HttpGet("{plate}")]
        public async Task<IActionResult> GetVehicleByPlate(string plate)
        {
            var vehicle = await _vehicleService.GetVehicleByIdAsync(plate);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }

        [HttpPost]
        public async Task<IActionResult> CreateVehicle([FromBody] VehicleRequest request)
        {
            var result = await _vehicleService.CreateVehicleAsync(request);
            return CreatedAtAction(nameof(GetVehicleByPlate), new { plate = result.Plate }, result);
        }

        [HttpPut("{plate}")]
        public async Task<IActionResult> UpdateVehicle(string plate, [FromBody] VehicleRequest request)
        {
            var success = await _vehicleService.UpdateVehicleAsync(plate, request);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{plate}")]
        public async Task<IActionResult> DeleteVehicle(string plate)
        {
            try
            {
                var success = await _vehicleService.DeleteVehicleAsync(plate);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableVehicles([FromQuery] int companyId, [FromQuery] string? type, [FromQuery] int? minCapacity)
        {
            var vehicles = await _vehicleService.GetAvailableVehiclesAsync(companyId, type, minCapacity);
            return Ok(vehicles);
        }

        [HttpGet("{plate}/calculate-price")]
        public async Task<IActionResult> CalculatePrice(string plate, [FromQuery] int days = 1)
        {
            var calculation = await _vehicleService.CalculatePriceAsync(plate, days);
            if (calculation == null) return NotFound("Araç bulunamadı.");
            return Ok(calculation);
        }
    }
}