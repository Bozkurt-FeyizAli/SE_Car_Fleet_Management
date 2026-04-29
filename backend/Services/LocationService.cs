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

        public async Task<IEnumerable<LocationResponse>> GetAllLocationsAsync()
        {
            return await _context.Locations
                .Include(l => l.Address)
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

        public async Task<LocationResponse?> GetLocationByIdAsync(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Address)
                .FirstOrDefaultAsync(l => l.Id == id);
            
            if (location == null) return null;

            return new LocationResponse
            {
                Id = location.Id,
                CompanyId = location.CompanyId,
                LocationName = location.LocationName,
                Latitude = location.Latitude,
                Longitude = location.Longitude,
                AddressId = location.AddressId,
                FullAddress = location.Address != null ? location.Address.FullAddress : string.Empty
            };
        }

        public async Task<bool> UpdateLocationAsync(int id, LocationRequest request)
        {
            var location = await _context.Locations
                .Include(l => l.Address)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (location == null) return false;

            location.CompanyId = request.CompanyId;
            location.LocationName = request.LocationName;
            location.Latitude = request.Latitude;
            location.Longitude = request.Longitude;

            if (location.Address != null && request.Address != null)
            {
                location.Address.City = request.Address.City;
                location.Address.District = request.Address.District;
                location.Address.Neighborhood = request.Address.Neighborhood;
                location.Address.FullAddress = request.Address.FullAddress;
                location.Address.ZipCode = request.Address.ZipCode;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLocationAsync(int id)
        {
            var location = await _context.Locations
                .Include(l => l.Address)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (location == null) return false;

            _context.Locations.Remove(location);
            if (location.Address != null)
            {
                _context.Addresses.Remove(location.Address);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
