using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface ITripService
    {
        Task<TripResponse> StartTripAsync(TripRequest request);
        Task<TripResponse> CompleteTripAsync(int tripId, CompleteTripRequest request);
        Task<IEnumerable<TripResponse>> GetActiveTripsByCompanyAsync(int companyId);
    }
}
