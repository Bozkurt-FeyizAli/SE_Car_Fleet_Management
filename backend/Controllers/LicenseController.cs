using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/licenses")]
    // [Authorize]
    public class LicenseController : ControllerBase
    {
        private readonly ILicenseService _licenseService;

        public LicenseController(ILicenseService licenseService)
        {
            _licenseService = licenseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLicenses()
        {
            var licenses = await _licenseService.GetAllLicensesAsync();
            return Ok(licenses);
        }

        [HttpGet("{licenseNumber}")]
        public async Task<IActionResult> GetLicenseByNumber(string licenseNumber)
        {
            var license = await _licenseService.GetLicenseByNumberAsync(licenseNumber);
            if (license == null) return NotFound();
            return Ok(license);
        }

        [HttpPost]
        public async Task<IActionResult> CreateLicense([FromBody] LicenseRequest request)
        {
            try
            {
                var result = await _licenseService.CreateLicenseAsync(request);
                return CreatedAtAction(nameof(GetLicenseByNumber), new { licenseNumber = result.LicenseNumber }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{licenseNumber}")]
        public async Task<IActionResult> UpdateLicense(string licenseNumber, [FromBody] LicenseRequest request)
        {
            try
            {
                var success = await _licenseService.UpdateLicenseAsync(licenseNumber, request);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{licenseNumber}")]
        public async Task<IActionResult> DeleteLicense(string licenseNumber)
        {
            try
            {
                var success = await _licenseService.DeleteLicenseAsync(licenseNumber);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
