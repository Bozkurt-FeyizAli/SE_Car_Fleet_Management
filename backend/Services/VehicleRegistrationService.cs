using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class VehicleRegistrationService : IVehicleRegistrationService
    {
        private readonly AppDbContext _context;

        public VehicleRegistrationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<VehicleRegistrationResponse>> GetAllRegistrationsAsync()
        {
            var registrations = await _context.VehicleRegistrations.ToListAsync();
            return registrations.Select(r => new VehicleRegistrationResponse(r));
        }

        public async Task<VehicleRegistrationResponse?> GetRegistrationByIdAsync(string registrationNumber)
        {
            var registration = await _context.VehicleRegistrations.FindAsync(registrationNumber);
            if (registration == null) return null;
            return new VehicleRegistrationResponse(registration);
        }

        public async Task<VehicleRegistrationResponse> CreateRegistrationAsync(VehicleRegistrationRequest request)
        {
            var registration = new VehicleRegistration
            {
                RegistrationNumber = request.RegistrationNumber,
                BrandModel = request.BrandModel,
                Year = request.Year,
                Type = request.Type,
                Capacity = request.Capacity
            };

            _context.VehicleRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            return new VehicleRegistrationResponse(registration);
        }

        public async Task<bool> UpdateRegistrationAsync(string registrationNumber, VehicleRegistrationRequest request)
        {
            var registration = await _context.VehicleRegistrations.FindAsync(registrationNumber);
            if (registration == null) return false;

            registration.BrandModel = request.BrandModel;
            registration.Year = request.Year;
            registration.Type = request.Type;
            registration.Capacity = request.Capacity;

            _context.VehicleRegistrations.Update(registration);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRegistrationAsync(string registrationNumber)
        {
            var registration = await _context.VehicleRegistrations.FindAsync(registrationNumber);
            if (registration == null) return false;

            _context.VehicleRegistrations.Remove(registration);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
