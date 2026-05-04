using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<DepartmentResponse>> GetAllAsync();
        Task<IEnumerable<DepartmentResponse>> GetByCompanyAsync(int companyId);
        Task<DepartmentResponse?> GetByIdAsync(int id);
        Task<DepartmentResponse> CreateAsync(DepartmentRequest request);
        Task<bool> UpdateAsync(int id, DepartmentRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
