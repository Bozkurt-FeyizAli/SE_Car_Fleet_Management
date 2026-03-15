using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class VehicleService : IVehicleService
    {
        private readonly AppDbContext _context;

        public VehicleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<VehicleResponse>> GetAllVehiclesAsync()
        {
            var vehicles = await _context.Vehicles.ToListAsync();
            return vehicles.Select(v => new VehicleResponse(v));
        }

        public async Task<VehicleResponse?> GetVehicleByIdAsync(uint id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null) return null;
            return new VehicleResponse(vehicle);
        }

        public async Task<VehicleResponse> CreateVehicleAsync(VehicleRequest request)
        {
            var vehicle = new Vehicle
            {
                PlateNumber = request.PlateNumber,
                RegistrationNumber = request.RegistrationNumber,
                BrandModel = request.BrandModel,
                Year = request.Year,
                VehicleType = request.VehicleType,
                CapacityKg = request.CapacityKg,
                BaseRentPrice = request.BaseRentPrice,
                InsuranceStartDate = request.InsuranceStartDate,
                InsuranceEndDate = request.InsuranceEndDate,
                CascoStartDate = request.CascoStartDate,
                CascoEndDate = request.CascoEndDate,
                InspectionStartDate = request.InspectionStartDate,
                InspectionEndDate = request.InspectionEndDate,
                NextMaintenanceKm = request.NextMaintenanceKm,
                IsActive = request.IsActive
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return new VehicleResponse(vehicle);
        }

        public async Task<bool> UpdateVehicleAsync(uint id, VehicleRequest request)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null) return false;

            vehicle.PlateNumber = request.PlateNumber;
            vehicle.RegistrationNumber = request.RegistrationNumber;
            vehicle.BrandModel = request.BrandModel;
            vehicle.Year = request.Year;
            vehicle.VehicleType = request.VehicleType;
            vehicle.CapacityKg = request.CapacityKg;
            vehicle.BaseRentPrice = request.BaseRentPrice;
            vehicle.InsuranceStartDate = request.InsuranceStartDate;
            vehicle.InsuranceEndDate = request.InsuranceEndDate;
            vehicle.CascoStartDate = request.CascoStartDate;
            vehicle.CascoEndDate = request.CascoEndDate;
            vehicle.InspectionStartDate = request.InspectionStartDate;
            vehicle.InspectionEndDate = request.InspectionEndDate;
            vehicle.NextMaintenanceKm = request.NextMaintenanceKm;
            vehicle.IsActive = request.IsActive;

            _context.Vehicles.Update(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVehicleAsync(uint id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null) return false;

            vehicle.IsDeleted = true; // Soft delete
            _context.Vehicles.Update(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}