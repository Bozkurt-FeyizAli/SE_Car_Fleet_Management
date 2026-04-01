using Backend.Models;

namespace Backend.DTOs
{
    public class CompanyResponse
    {
        public int Id { get; set; }
        public string CompanyName { get; set; }
        public string TaxNumber { get; set; }

        public CompanyResponse(Company company)
        {
            Id = company.Id;
            CompanyName = company.CompanyName;
            TaxNumber = company.TaxNumber;
        }
    }
}
