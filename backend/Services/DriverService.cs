using Backend.Data;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class DriverService : IDriverService
    {
        private readonly AppDbContext _context;

        public DriverService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetDriverPerformanceAsync(int driverId)
        {
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
            {
                throw new Exception("Driver not found");
            }

            var trips = await _context.Trips
                .Include(t => t.StartLocation)
                .Include(t => t.EndLocation)
                .Where(t => t.DriverId == driverId)
                .Select(t => new
                {
                    t.Id,
                    t.VehiclePlate,
                    StartLocation = t.StartLocation.LocationName,
                    EndLocation = t.EndLocation.LocationName,
                    t.StartTime,
                    t.EndTime,
                    t.StartKm,
                    t.EndKm,
                    t.TotalFee,
                    t.Status
                })
                .OrderByDescending(t => t.StartTime)
                .ToListAsync();

            return new
            {
                DriverId = driver.Id,
                CurrentPoints = driver.Points,
                Status = driver.Status,
                TripHistory = trips
            };
        }
    }
}
