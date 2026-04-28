using Backend.DTOs.Requests;
using Backend.DTOs.Responses;

namespace Backend.Services.Interfaces
{
    public interface IAddressService
    {
        Task<IEnumerable<AddressResponse>> GetAllAsync();
        Task<AddressResponse> GetByIdAsync(int id);
        Task<AddressResponse> CreateAsync(AddressRequest request);
        Task<bool> UpdateAsync(int id, AddressRequest request);
        Task<bool> DeleteAsync(int id);
    }
}
