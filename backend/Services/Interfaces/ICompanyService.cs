using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface ICompanyService
    {
        Task<IEnumerable<CompanyResponse>> GetAllCompaniesAsync();
        Task<CompanyResponse?> GetCompanyByIdAsync(int id);
        Task<CompanyResponse> CreateCompanyAsync(CompanyRequest request);
        Task<bool> UpdateCompanyAsync(int id, CompanyRequest request);
        Task<bool> DeleteCompanyAsync(int id);
    }
}
