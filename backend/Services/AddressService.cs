using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class AddressService : IAddressService
    {
        private readonly AppDbContext _context;

        public AddressService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AddressResponse>> GetAllAsync()
        {
            var entities = await _context.Addresses.ToListAsync();
            return entities.Select(entity => new AddressResponse
            {
                Id = entity.Id,
                City = entity.City,
                District = entity.District,
                Neighborhood = entity.Neighborhood,
                FullAddress = entity.FullAddress,
                ZipCode = entity.ZipCode
            });
        }

        public async Task<AddressResponse> GetByIdAsync(int id)
        {
            var entity = await _context.Addresses.FindAsync(id);
            if (entity == null) return null;

            return new AddressResponse
            {
                Id = entity.Id,
                City = entity.City,
                District = entity.District,
                Neighborhood = entity.Neighborhood,
                FullAddress = entity.FullAddress,
                ZipCode = entity.ZipCode
            };
        }

        public async Task<AddressResponse> CreateAsync(AddressRequest request)
        {
            var entity = new Address
            {
                City = request.City,
                District = request.District,
                Neighborhood = request.Neighborhood,
                FullAddress = request.FullAddress,
                ZipCode = request.ZipCode
            };

            _context.Addresses.Add(entity);
            await _context.SaveChangesAsync();

            return new AddressResponse
            {
                Id = entity.Id,
                City = entity.City,
                District = entity.District,
                Neighborhood = entity.Neighborhood,
                FullAddress = entity.FullAddress,
                ZipCode = entity.ZipCode
            };
        }

        public async Task<bool> UpdateAsync(int id, AddressRequest request)
        {
            var entity = await _context.Addresses.FindAsync(id);
            if (entity == null) return false;

                        entity.City = request.City;
            entity.District = request.District;
            entity.Neighborhood = request.Neighborhood;
            entity.FullAddress = request.FullAddress;
            entity.ZipCode = request.ZipCode;

            _context.Addresses.Update(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.Addresses.FindAsync(id);
            if (entity == null) return false;

            _context.Addresses.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
