using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IRentalService
    {
        Task<RentalResponse> CreateRentalRequestAsync(RentalRequest request);
        Task<IEnumerable<RentalResponse>> GetMyRentalsAsync(int companyId);
        Task<RentalResponse> ReturnVehicleAsync(int rentalId, ReturnRentalRequest request);
    }
}
