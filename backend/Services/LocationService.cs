using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class LocationService : ILocationService
    {
        private readonly AppDbContext _context;

        public LocationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<LocationResponse> AddLocationAsync(LocationRequest request)
        {
            var address = new Address
            {
                City = request.Address.City,
                District = request.Address.District,
                Neighborhood = request.Address.Neighborhood,
                FullAddress = request.Address.FullAddress,
                ZipCode = request.Address.ZipCode
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var location = new Location
            {
                CompanyId = request.CompanyId,
                AddressId = address.Id,
                LocationName = request.LocationName,
                Latitude = request.Latitude,
                Longitude = request.Longitude
            };

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return new LocationResponse
            {
                Id = location.Id,
                CompanyId = location.CompanyId,
                LocationName = location.LocationName,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                AddressId = location.AddressId,
                FullAddress = address.FullAddress
            };
        }

        public async Task<IEnumerable<LocationResponse>> GetLocationsByCompanyAsync(int companyId)
        {
            return await _context.Locations
                .Include(l => l.Address)
                .Where(l => l.CompanyId == companyId)
                .Select(l => new LocationResponse
                {
                    Id = l.Id,
                    CompanyId = l.CompanyId,
                    LocationName = l.LocationName,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    AddressId = l.AddressId,
                    FullAddress = l.Address != null ? l.Address.FullAddress : string.Empty
                })
                .ToListAsync();
        }
    }
}
