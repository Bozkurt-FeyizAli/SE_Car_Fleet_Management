using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/managers")]
    // [Authorize] // Un-comment when JWT is fully tested
    public class ManagerController : ControllerBase
    {
        private readonly IManagerService _managerService;

        public ManagerController(IManagerService managerService)
        {
            _managerService = managerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllManagers()
        {
            var managers = await _managerService.GetAllManagersAsync();
            return Ok(managers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetManagerById(int id)
        {
            var manager = await _managerService.GetManagerByIdAsync(id);
            if (manager == null) return NotFound();
            return Ok(manager);
        }

        [HttpPost]
        public async Task<IActionResult> CreateManager([FromBody] ManagerRequest request)
        {
            try
            {
                var result = await _managerService.CreateManagerAsync(request);
                return CreatedAtAction(nameof(GetManagerById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateManager(int id, [FromBody] ManagerRequest request)
        {
            try
            {
                var success = await _managerService.UpdateManagerAsync(id, request);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteManager(int id)
        {
            try
            {
                var success = await _managerService.DeleteManagerAsync(id);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/permissions")]
        public async Task<IActionResult> GetPermissions(int id)
        {
            var permissions = await _managerService.GetManagerPermissionsAsync(id);
            return Ok(permissions);
        }
    }
}
