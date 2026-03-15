using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVehicleById(uint id)
        {
            var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }

        [HttpPost]
        public async Task<IActionResult> CreateVehicle([FromBody] VehicleRequest request)
        {
            var result = await _vehicleService.CreateVehicleAsync(request);
            return CreatedAtAction(nameof(GetVehicleById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVehicle(uint id, [FromBody] VehicleRequest request)
        {
            var success = await _vehicleService.UpdateVehicleAsync(id, request);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(uint id)
        {
            var success = await _vehicleService.DeleteVehicleAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}