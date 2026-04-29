using Backend.DTOs.Requests;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManagerPermissionController : ControllerBase
    {
        private readonly IManagerPermissionService _managerPermissionService;

        public ManagerPermissionController(IManagerPermissionService managerPermissionService)
        {
            _managerPermissionService = managerPermissionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _managerPermissionService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _managerPermissionService.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ManagerPermissionRequest request)
        {
            var result = await _managerPermissionService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ManagerPermissionRequest request)
        {
            var success = await _managerPermissionService.UpdateAsync(id, request);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _managerPermissionService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
