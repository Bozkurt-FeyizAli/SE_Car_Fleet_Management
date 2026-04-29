using Backend.DTOs.Requests;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriverVehicleAssignmentController : ControllerBase
    {
        private readonly IDriverVehicleAssignmentService _driverVehicleAssignmentService;

        public DriverVehicleAssignmentController(IDriverVehicleAssignmentService driverVehicleAssignmentService)
        {
            _driverVehicleAssignmentService = driverVehicleAssignmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _driverVehicleAssignmentService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _driverVehicleAssignmentService.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DriverVehicleAssignmentRequest request)
        {
            var result = await _driverVehicleAssignmentService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DriverVehicleAssignmentRequest request)
        {
            var success = await _driverVehicleAssignmentService.UpdateAsync(id, request);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _driverVehicleAssignmentService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
