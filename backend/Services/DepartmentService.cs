using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly AppDbContext _context;

        public DepartmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DepartmentResponse>> GetAllAsync()
        {
            var departments = await _context.Departments.ToListAsync();
            return departments.Select(d => new DepartmentResponse(d));
        }

        public async Task<IEnumerable<DepartmentResponse>> GetByCompanyAsync(int companyId)
        {
            var departments = await _context.Departments
                .Where(d => d.CompanyId == companyId)
                .ToListAsync();
            return departments.Select(d => new DepartmentResponse(d));
        }

        public async Task<DepartmentResponse?> GetByIdAsync(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return null;
            return new DepartmentResponse(department);
        }

        public async Task<DepartmentResponse> CreateAsync(DepartmentRequest request)
        {
            var companyExists = await _context.Companies.AnyAsync(c => c.Id == request.CompanyId);
            if (!companyExists)
                throw new Exception("Şirket bulunamadı.");

            var department = new Department
            {
                CompanyId = request.CompanyId,
                DepartmentName = request.DepartmentName
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return new DepartmentResponse(department);
        }

        public async Task<bool> UpdateAsync(int id, DepartmentRequest request)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return false;

            department.CompanyId = request.CompanyId;
            department.DepartmentName = request.DepartmentName;

            _context.Departments.Update(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Managers)
                .Include(d => d.DepartmentPermissions)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null) return false;

            if (department.Managers.Any())
                throw new Exception("Bu departmana bağlı yöneticiler var. Önce yöneticileri başka departmana taşıyın.");

            _context.DepartmentPermissions.RemoveRange(department.DepartmentPermissions);
            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
