using Backend.DTOs.Requests;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
    public class TripsController : ControllerBase
    {
        private readonly ITripService _tripService;

        public TripsController(ITripService tripService)
        {
            _tripService = tripService;
        }

        [HttpGet("active/{companyId}")]
        public async Task<IActionResult> GetActiveTrips(int companyId)
        {
            try
            {
                var trips = await _tripService.GetActiveTripsByCompanyAsync(companyId);
                return Ok(trips);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllTrips()
        {
            try
            {
                var trips = await _tripService.GetAllTripsAsync();
                return Ok(trips);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("start")]
        public async Task<IActionResult> StartTrip([FromBody] TripRequest request)
        {
            try
            {
                var trip = await _tripService.StartTripAsync(request);
                return Ok(trip);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/accept")]
        public async Task<IActionResult> AcceptTrip(int id)
        {
            try
            {
                var trip = await _tripService.AcceptTripAsync(id);
                return Ok(trip);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/reject")]
        public async Task<IActionResult> RejectTrip(int id)
        {
            try
            {
                var trip = await _tripService.RejectTripAsync(id);
                return Ok(trip);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> CompleteTrip(int id, [FromBody] CompleteTripRequest request)
        {
            try
            {
                var trip = await _tripService.CompleteTripAsync(id, request);
                return Ok(trip);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTripById(int id)
        {
            try
            {
                var trip = await _tripService.GetTripByIdAsync(id);
                if (trip == null) return NotFound(new { message = "Trip not found" });
                return Ok(trip);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrip(int id, [FromBody] TripRequest request)
        {
            try
            {
                var success = await _tripService.UpdateTripAsync(id, request);
                if (!success) return NotFound(new { message = "Trip not found" });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrip(int id)
        {
            try
            {
                var success = await _tripService.DeleteTripAsync(id);
                if (!success) return NotFound(new { message = "Trip not found" });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
