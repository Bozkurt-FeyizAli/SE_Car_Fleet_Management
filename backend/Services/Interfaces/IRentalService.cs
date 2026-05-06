using Backend.DTOs;

namespace Backend.Services.Interfaces
{
    public interface IRentalService
    {
        Task<RentalResponse> CreateRentalRequestAsync(RentalRequest request);
        Task<IEnumerable<RentalResponse>> GetMyRentalsAsync(int companyId);
        Task<IEnumerable<RentalResponse>> GetAllRentalsAsync();
        Task<RentalResponse> ReturnVehicleAsync(int rentalId, ReturnRentalRequest request);
        Task<RentalResponse?> GetRentalByIdAsync(int id);
        Task<bool> UpdateRentalAsync(int id, RentalRequest request);
        Task<bool> DeleteRentalAsync(int id);
        Task<RentalResponse> ApproveRentalAsync(int rentalId);
        Task<RentalResponse> RejectRentalAsync(int rentalId);
    }
}
