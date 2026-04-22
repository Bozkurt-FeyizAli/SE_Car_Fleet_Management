using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class LicenseService : ILicenseService
    {
        private readonly AppDbContext _context;

        public LicenseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<LicenseResponse>> GetAllLicensesAsync()
        {
            var licenses = await _context.Licenses.ToListAsync();
            return licenses.Select(l => new LicenseResponse(l));
        }

        public async Task<LicenseResponse?> GetLicenseByNumberAsync(string licenseNumber)
        {
            var license = await _context.Licenses.FirstOrDefaultAsync(l => l.LicenseNumber == licenseNumber);
            if (license == null) return null;
            return new LicenseResponse(license);
        }

        public async Task<LicenseResponse> CreateLicenseAsync(LicenseRequest request)
        {
            var existingLicense = await _context.Licenses.FirstOrDefaultAsync(l => l.LicenseNumber == request.LicenseNumber);
            if (existingLicense != null)
                throw new Exception("Bu ehliyet numarası zaten sistemde kayıtlı.");

            var license = new License
            {
                LicenseNumber = request.LicenseNumber,
                LicenseType = request.LicenseType
            };

            _context.Licenses.Add(license);
            await _context.SaveChangesAsync();

            return new LicenseResponse(license);
        }

        public async Task<bool> UpdateLicenseAsync(string licenseNumber, LicenseRequest request)
        {
            var license = await _context.Licenses.FirstOrDefaultAsync(l => l.LicenseNumber == licenseNumber);
            if (license == null) return false;

            // We do not change the PK (LicenseNumber). If they want to change it, they should delete and recreate.
            license.LicenseType = request.LicenseType;

            _context.Licenses.Update(license);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLicenseAsync(string licenseNumber)
        {
            var license = await _context.Licenses.FirstOrDefaultAsync(l => l.LicenseNumber == licenseNumber);
            if (license == null) return false;

            // Optional: check if any drivers use this license.
            var driverUsingLicense = await _context.Drivers.AnyAsync(d => d.LicenseNumber == licenseNumber);
            if (driverUsingLicense)
                throw new Exception("Bu ehliyet bir sürücüye atanmış durumda, silinemez.");

            _context.Licenses.Remove(license);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
