using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/vehicle-registrations")]
    public class VehicleRegistrationController : ControllerBase
    {
        private readonly IVehicleRegistrationService _registrationService;

        public VehicleRegistrationController(IVehicleRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRegistrations()
        {
            var registrations = await _registrationService.GetAllRegistrationsAsync();
            return Ok(registrations);
        }

        [HttpGet("{registrationNumber}")]
        public async Task<IActionResult> GetRegistrationById(string registrationNumber)
        {
            var registration = await _registrationService.GetRegistrationByIdAsync(registrationNumber);
            if (registration == null) return NotFound(new { message = "Registration not found" });
            return Ok(registration);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRegistration([FromBody] VehicleRegistrationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var registration = await _registrationService.CreateRegistrationAsync(request);
            return CreatedAtAction(nameof(GetRegistrationById), new { registrationNumber = registration.RegistrationNumber }, registration);
        }

        [HttpPut("{registrationNumber}")]
        public async Task<IActionResult> UpdateRegistration(string registrationNumber, [FromBody] VehicleRegistrationRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _registrationService.UpdateRegistrationAsync(registrationNumber, request);
            if (!success) return NotFound(new { message = "Registration not found" });

            return NoContent();
        }

        [HttpDelete("{registrationNumber}")]
        public async Task<IActionResult> DeleteRegistration(string registrationNumber)
        {
            var success = await _registrationService.DeleteRegistrationAsync(registrationNumber);
            if (!success) return NotFound(new { message = "Registration not found" });

            return NoContent();
        }
    }
}
