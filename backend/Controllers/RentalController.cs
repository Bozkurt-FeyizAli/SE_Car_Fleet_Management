using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/rentals")]
    // [Authorize] // Un-comment when JWT is fully tested
    public class RentalController : ControllerBase
    {
        private readonly IRentalService _rentalService;

        public RentalController(IRentalService rentalService)
        {
            _rentalService = rentalService;
        }

        [HttpPost("request")]
        public async Task<IActionResult> RequestRental([FromBody] RentalRequest request)
        {
            try
            {
                var result = await _rentalService.CreateRentalRequestAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-rentals")]
        public async Task<IActionResult> GetMyRentals()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            if (!int.TryParse(companyIdClaim, out int companyId))
            {
                // Fallback for testing when authorize is commented or token parsing fails locally during mock requests
                // return Unauthorized(new { message = "CompanyId not found in token." });
                companyId = 1; // dummy fallback
            }

            var rentals = await _rentalService.GetMyRentalsAsync(companyId);
            return Ok(rentals);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllRentals()
        {
            try
            {
                var rentals = await _rentalService.GetAllRentalsAsync();
                return Ok(rentals);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/return")]
        public async Task<IActionResult> ReturnRental(int id, [FromBody] ReturnRentalRequest request)
        {
            try
            {
                var result = await _rentalService.ReturnVehicleAsync(id, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/approve")]
        public async Task<IActionResult> ApproveRental(int id)
        {
            try
            {
                var result = await _rentalService.ApproveRentalAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectRental(int id)
        {
            try
            {
                var result = await _rentalService.RejectRentalAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRentalById(int id)
        {
            try
            {
                var rental = await _rentalService.GetRentalByIdAsync(id);
                if (rental == null) return NotFound(new { message = "Rental not found" });
                return Ok(rental);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRental(int id, [FromBody] RentalRequest request)
        {
            try
            {
                var success = await _rentalService.UpdateRentalAsync(id, request);
                if (!success) return NotFound(new { message = "Rental not found" });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRental(int id)
        {
            try
            {
                var success = await _rentalService.DeleteRentalAsync(id);
                if (!success) return NotFound(new { message = "Rental not found" });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
