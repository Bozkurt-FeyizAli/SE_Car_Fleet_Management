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

        public async Task<VehicleResponse?> GetVehicleByIdAsync(string plate)
        {
            var vehicle = await _context.Vehicles.FindAsync(plate);
            if (vehicle == null) return null;
            return new VehicleResponse(vehicle);
        }

        public async Task<VehicleResponse> CreateVehicleAsync(VehicleRequest request)
        {
            var vehicle = new Vehicle
            {
                Plate = request.Plate,
                RegistrationNumber = request.RegistrationNumber,
                CurrentKm = request.CurrentKm,
                BaseRentPrice = request.BaseRentPrice,
                InsuranceEndDate = request.InsuranceEndDate,
                CascoEndDate = request.CascoEndDate,
                InspectionEndDate = request.InspectionEndDate,
                NextMaintenanceKm = request.NextMaintenanceKm,
                IsActive = request.IsActive,
                CompanyId = request.CompanyId,
                DamageRecordAmount = request.DamageRecordAmount
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return new VehicleResponse(vehicle);
        }

        public async Task<bool> UpdateVehicleAsync(string plate, VehicleRequest request)
        {
            var vehicle = await _context.Vehicles.FindAsync(plate);
            if (vehicle == null) return false;

            vehicle.RegistrationNumber = request.RegistrationNumber;
            vehicle.CurrentKm = request.CurrentKm;
            vehicle.BaseRentPrice = request.BaseRentPrice;
            vehicle.InsuranceEndDate = request.InsuranceEndDate;
            vehicle.CascoEndDate = request.CascoEndDate;
            vehicle.InspectionEndDate = request.InspectionEndDate;
            vehicle.NextMaintenanceKm = request.NextMaintenanceKm;
            vehicle.IsActive = request.IsActive;
            vehicle.CompanyId = request.CompanyId;
            vehicle.DamageRecordAmount = request.DamageRecordAmount;

            _context.Vehicles.Update(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVehicleAsync(string plate)
        {
            var vehicle = await _context.Vehicles.FindAsync(plate);
            if (vehicle == null) return false;

            // Aktif kiralama varsa silmeyi engelle
            var activeRental = await _context.Rentals
                .AnyAsync(r => r.VehiclePlate == plate && !r.IsCompleted);
            if (activeRental)
                throw new Exception("Bu araç şu anda kiralamada. Önce kiralamayı tamamlayın.");

            // Aktif sefer varsa silmeyi engelle
            var activeTrip = await _context.Trips
                .AnyAsync(t => t.VehiclePlate == plate && t.Status != "Completed" && t.Status != "Cancelled");
            if (activeTrip)
                throw new Exception("Bu araç şu anda bir seferde. Önce seferi tamamlayın.");

            // Tamamlanmış kiralama kayıtlarını sil
            var completedRentals = await _context.Rentals
                .Where(r => r.VehiclePlate == plate)
                .ToListAsync();
            _context.Rentals.RemoveRange(completedRentals);

            // Tamamlanmış sefer kayıtlarını sil
            var completedTrips = await _context.Trips
                .Where(t => t.VehiclePlate == plate)
                .ToListAsync();
            _context.Trips.RemoveRange(completedTrips);

            // Sürücü-araç eşleşmelerini sil
            var assignments = await _context.DriverVehicleAssignments
                .Where(a => a.VehiclePlate == plate)
                .ToListAsync();
            _context.DriverVehicleAssignments.RemoveRange(assignments);

            // Sürücülerin VehiclePlate referansını temizle
            var drivers = await _context.Drivers
                .Where(d => d.VehiclePlate == plate)
                .ToListAsync();
            foreach (var driver in drivers)
            {
                driver.VehiclePlate = null;
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<VehicleResponse>> GetAvailableVehiclesAsync(int companyId, string? type, int? minCapacity)
        {
            var query = _context.Vehicles
                .Include(v => v.VehicleRegistration)
                .Where(v => v.CompanyId != companyId && v.IsActive && v.Status == "Müsait");

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(v => v.VehicleRegistration != null && v.VehicleRegistration.Type == type);
            }

            if (minCapacity.HasValue)
            {
                query = query.Where(v => v.VehicleRegistration != null && v.VehicleRegistration.Capacity >= minCapacity.Value);
            }

            var vehicles = await query.ToListAsync();
            return vehicles.Select(v => new VehicleResponse(v));
        }

        public async Task<PriceCalculationResponse?> CalculatePriceAsync(string plate, int days)
        {
            var vehicle = await _context.Vehicles.FindAsync(plate);
            if (vehicle == null) return null;

            var rules = await _context.RentalPricingRules.ToDictionaryAsync(r => r.ParameterName, r => r.Value);

            decimal baseMultiplier = rules.GetValueOrDefault("taban_fiyat_katsayisi", 1.0m);
            
            // Example logic for KM multiplier
            decimal kmMultiplier = 1.0m;
            if (vehicle.CurrentKm > 100000) 
                kmMultiplier = rules.GetValueOrDefault("km_carpani", 1.0m);
            
            // Example logic for Damage multiplier
            decimal damageMultiplier = 1.0m;
            if (vehicle.DamageRecordAmount == null || vehicle.DamageRecordAmount == 0)
                damageMultiplier = rules.GetValueOrDefault("hasarsizlik_indirimi", 1.0m);

            decimal finalBasePrice = vehicle.BaseRentPrice * baseMultiplier;
            decimal pricePerDay = finalBasePrice * kmMultiplier * damageMultiplier;
            decimal totalCost = pricePerDay * days;

            return new PriceCalculationResponse
            {
                VehiclePlate = vehicle.Plate,
                BasePrice = vehicle.BaseRentPrice,
                FinalPricePerDay = pricePerDay,
                TotalEstimatedPrice = totalCost
            };
        }
    }
}