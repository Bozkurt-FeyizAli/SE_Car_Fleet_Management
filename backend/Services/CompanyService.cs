using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly AppDbContext _context;

        public CompanyService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CompanyResponse>> GetAllCompaniesAsync()
        {
            var companies = await _context.Companies.ToListAsync();
            return companies.Select(c => new CompanyResponse(c));
        }

        public async Task<CompanyResponse?> GetCompanyByIdAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return null;
            return new CompanyResponse(company);
        }

        public async Task<CompanyResponse> CreateCompanyAsync(CompanyRequest request)
        {
            var company = new Company
            {
                CompanyName = request.CompanyName,
                TaxNumber = request.TaxNumber
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return new CompanyResponse(company);
        }

        public async Task<bool> UpdateCompanyAsync(int id, CompanyRequest request)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return false;

            company.CompanyName = request.CompanyName;
            company.TaxNumber = request.TaxNumber;

            _context.Companies.Update(company);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return false;

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
