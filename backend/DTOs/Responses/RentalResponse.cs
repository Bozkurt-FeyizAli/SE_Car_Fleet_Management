using Backend.Models;

namespace Backend.DTOs
{
    public class RentalResponse
    {
        public int Id { get; set; }
        public string VehiclePlate { get; set; } = string.Empty;
        public int RenterCompanyId { get; set; }
        public int RentedCompanyId { get; set; }
        public int OwnerCompanyId { get; set; }
        public string OwnerCompanyName { get; set; } = string.Empty;
        public string RenterCompanyName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RentStartKm { get; set; }
        public DateTime? ReturnDate { get; set; }
        public decimal? TotalPrice { get; set; }
        public bool IsCompleted { get; set; }
        public string Status { get; set; } = string.Empty;

        public RentalResponse() { }

        public RentalResponse(Rental rental)
        {
            Id = rental.Id;
            VehiclePlate = rental.VehiclePlate;
            RenterCompanyId = rental.RenterCompanyId;
            RentedCompanyId = rental.RentedCompanyId;
            OwnerCompanyId = rental.Vehicle?.CompanyId ?? rental.RentedCompanyId;
            OwnerCompanyName = rental.Vehicle?.Company?.CompanyName ?? rental.RentedCompany?.CompanyName ?? string.Empty;
            RenterCompanyName = rental.RenterCompany?.CompanyName ?? string.Empty;
            StartDate = rental.StartDate;
            EndDate = rental.EndDate;
            RentStartKm = rental.RentStartKm;
            ReturnDate = rental.ReturnDate;
            TotalPrice = rental.TotalPrice;
            IsCompleted = rental.IsCompleted;
            Status = rental.Status;
        }
    }
}
