using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class TripService : ITripService
    {
        private readonly AppDbContext _context;

        public TripService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TripResponse>> GetActiveTripsByCompanyAsync(int companyId)
        {
            return await _context.Trips
                .Include(t => t.Vehicle)
                .Where(t => t.Vehicle.CompanyId == companyId && t.Status != "Completed" && t.Status != "Cancelled")
                .Select(t => new TripResponse
                {
                    Id = t.Id,
                    DriverId = t.DriverId,
                    VehiclePlate = t.VehiclePlate,
                    StartLocationId = t.StartLocationId,
                    EndLocationId = t.EndLocationId,
                    StartTime = t.StartTime,
                    EndTime = t.EndTime,
                    StartKm = t.StartKm,
                    EndKm = t.EndKm,
                    TotalFee = t.TotalFee,
                    Status = t.Status
                })
                .ToListAsync();
        }

        public async Task<TripResponse> StartTripAsync(TripRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == request.DriverId);
                if (driver == null) throw new Exception("Driver not found.");
                if (driver.Status != "Idle") throw new Exception("Driver is already busy or in a trip.");

                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Plate == request.VehiclePlate);
                if (vehicle == null) throw new Exception("Vehicle not found.");
                if (!vehicle.IsActive) throw new Exception("Vehicle is not active or is currently in use.");

                var startLocation = await _context.Locations.FindAsync(request.StartLocationId);
                var endLocation = await _context.Locations.FindAsync(request.EndLocationId);
                if (startLocation == null || endLocation == null) throw new Exception("Locations not found.");

                string? warningMessage = null;
                if (vehicle.NextMaintenanceKm - vehicle.CurrentKm <= 500)
                {
                    warningMessage = $"Warning: Vehicle {vehicle.Plate} is approaching maintenance. Only {vehicle.NextMaintenanceKm - vehicle.CurrentKm} km left.";
                }

                var trip = new Trip
                {
                    DriverId = driver.Id,
                    VehiclePlate = vehicle.Plate,
                    StartLocationId = request.StartLocationId,
                    EndLocationId = request.EndLocationId,
                    StartTime = DateTime.UtcNow,
                    StartKm = vehicle.CurrentKm,
                    Status = "InTrip"
                };

                _context.Trips.Add(trip);

                vehicle.IsActive = false;
                driver.Status = "InTrip";
                driver.VehiclePlate = vehicle.Plate;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new TripResponse
                {
                    Id = trip.Id,
                    DriverId = trip.DriverId,
                    VehiclePlate = trip.VehiclePlate,
                    StartLocationId = trip.StartLocationId,
                    EndLocationId = trip.EndLocationId,
                    StartTime = trip.StartTime,
                    StartKm = trip.StartKm,
                    Status = trip.Status,
                    WarningMessage = warningMessage
                };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<TripResponse> CompleteTripAsync(int tripId, CompleteTripRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Id == tripId);
                if (trip == null) throw new Exception("Trip not found.");
                if (trip.Status == "Completed") throw new Exception("Trip already completed.");

                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Plate == trip.VehiclePlate);
                if (vehicle == null) throw new Exception("Vehicle not found.");

                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == trip.DriverId);
                if (driver == null) throw new Exception("Driver not found.");

                if (request.EndKm < trip.StartKm) throw new Exception("End KM cannot be less than Start KM.");

                trip.EndKm = request.EndKm;
                trip.EndTime = DateTime.UtcNow;
                trip.Status = "Completed";

                decimal distanceKm = request.EndKm - trip.StartKm;
                trip.TotalFee = distanceKm * 10;

                vehicle.CurrentKm = request.EndKm;
                vehicle.IsActive = true; 
                
                driver.Status = "Idle";
                driver.VehiclePlate = null;

                decimal expectedHours = distanceKm / 60m;
                if (expectedHours == 0) expectedHours = 1;

                var actualHours = (trip.EndTime.Value - trip.StartTime).TotalHours;

                if (actualHours > (double)expectedHours + 1.0)
                {
                    int penalty = (int)Math.Floor(actualHours - (double)expectedHours) * 5;
                    driver.Points -= penalty;
                    if (driver.Points < 0) driver.Points = 0;
                }
                else
                {
                    driver.Points += 2;
                    if (driver.Points > 100) driver.Points = 100;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new TripResponse
                {
                    Id = trip.Id,
                    DriverId = trip.DriverId,
                    VehiclePlate = trip.VehiclePlate,
                    StartLocationId = trip.StartLocationId,
                    EndLocationId = trip.EndLocationId,
                    StartTime = trip.StartTime,
                    EndTime = trip.EndTime,
                    StartKm = trip.StartKm,
                    EndKm = trip.EndKm,
                    TotalFee = trip.TotalFee,
                    Status = trip.Status
                };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
