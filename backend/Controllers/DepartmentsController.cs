using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/departments")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _departmentService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("company/{companyId}")]
        public async Task<IActionResult> GetByCompany(int companyId)
        {
            var result = await _departmentService.GetByCompanyAsync(companyId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _departmentService.GetByIdAsync(id);
            if (result == null) return NotFound(new { message = "Departman bulunamadı." });
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DepartmentRequest request)
        {
            try
            {
                var result = await _departmentService.CreateAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentRequest request)
        {
            try
            {
                var success = await _departmentService.UpdateAsync(id, request);
                if (!success) return NotFound(new { message = "Departman bulunamadı." });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _departmentService.DeleteAsync(id);
                if (!success) return NotFound(new { message = "Departman bulunamadı." });
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
