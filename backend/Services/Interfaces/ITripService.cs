using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface ITripService
    {
        Task<TripResponse> StartTripAsync(TripRequest request);
        Task<TripResponse> CompleteTripAsync(int tripId, CompleteTripRequest request);
        Task<IEnumerable<TripResponse>> GetActiveTripsByCompanyAsync(int companyId);
        Task<IEnumerable<TripResponse>> GetAllTripsAsync();
        Task<TripResponse?> GetTripByIdAsync(int id);
        Task<bool> UpdateTripAsync(int id, TripRequest request);
        Task<bool> DeleteTripAsync(int id);
        Task<TripResponse> AcceptTripAsync(int tripId);
        Task<TripResponse> RejectTripAsync(int tripId);
    }
}
