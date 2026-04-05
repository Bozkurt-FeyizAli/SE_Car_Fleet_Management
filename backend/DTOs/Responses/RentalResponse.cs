using Backend.Models;

namespace Backend.DTOs
{
    public class RentalResponse
    {
        public int Id { get; set; }
        public string VehiclePlate { get; set; } = string.Empty;
        public int RenterCompanyId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal RentStartKm { get; set; }
        public DateTime? ReturnDate { get; set; }
        public decimal? TotalPrice { get; set; }

        public RentalResponse() { }

        public RentalResponse(Rental rental)
        {
            Id = rental.Id;
            VehiclePlate = rental.VehiclePlate;
            RenterCompanyId = rental.RenterCompanyId;
            StartDate = rental.StartDate;
            EndDate = rental.EndDate;
            RentStartKm = rental.RentStartKm;
            ReturnDate = rental.ReturnDate;
            TotalPrice = rental.TotalPrice;
        }
    }
}
