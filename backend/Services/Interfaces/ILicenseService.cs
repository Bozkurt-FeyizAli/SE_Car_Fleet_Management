using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface ILicenseService
    {
        Task<IEnumerable<LicenseResponse>> GetAllLicensesAsync();
        Task<LicenseResponse?> GetLicenseByNumberAsync(string licenseNumber);
        Task<LicenseResponse> CreateLicenseAsync(LicenseRequest request);
        Task<bool> UpdateLicenseAsync(string licenseNumber, LicenseRequest request);
        Task<bool> DeleteLicenseAsync(string licenseNumber);
    }
}
