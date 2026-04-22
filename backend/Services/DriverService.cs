using Backend.Data;
using Backend.DTOs;
using Backend.Models;
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

        public async Task<IEnumerable<DriverResponse>> GetAllDriversAsync()
        {
            var drivers = await _context.Drivers
                .Include(d => d.User)
                .ToListAsync();

            return drivers.Select(d => new DriverResponse(d));
        }

        public async Task<DriverResponse?> GetDriverByIdAsync(int id)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null) return null;
            return new DriverResponse(driver);
        }

        public async Task<DriverResponse> CreateDriverAsync(DriverRequest request)
        {
            // Kullanıcının var olduğunu kontrol et
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            // Aynı kullanıcıya ait driver zaten varsa engelle
            var existingDriver = await _context.Drivers
                .AnyAsync(d => d.UserId == request.UserId);
            if (existingDriver)
                throw new Exception("Bu kullanıcı zaten bir sürücü olarak kayıtlı.");

            // Ehliyet numarasının geçerli olduğunu kontrol et
            var license = await _context.Licenses
                .FirstOrDefaultAsync(l => l.LicenseNumber == request.LicenseNumber);
            if (license == null)
                throw new Exception("Geçersiz ehliyet numarası. Önce ehliyet kaydı oluşturun.");

            var driver = new Driver
            {
                UserId = request.UserId,
                VehiclePlate = request.VehiclePlate,
                LicenseNumber = request.LicenseNumber,
                Points = request.Points,
                Status = request.Status
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            // User navigation property'yi yükle (response için)
            await _context.Entry(driver).Reference(d => d.User).LoadAsync();

            return new DriverResponse(driver);
        }

        public async Task<bool> UpdateDriverAsync(int id, DriverRequest request)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null) return false;

            driver.UserId = request.UserId;
            driver.VehiclePlate = request.VehiclePlate;
            driver.LicenseNumber = request.LicenseNumber;
            driver.Points = request.Points;
            driver.Status = request.Status;

            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteDriverAsync(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null) return false;

            // Aktif seferdeyse silmeyi engelle
            if (driver.Status == "InTrip")
                throw new Exception("Sürücü aktif bir seferde. Önce seferi tamamlayın.");

            // İlişkili tamamlanmış trip kayıtlarını kontrol et
            var activeTrips = await _context.Trips
                .AnyAsync(t => t.DriverId == id && t.Status != "Completed" && t.Status != "Cancelled");
            if (activeTrips)
                throw new Exception("Sürücünün tamamlanmamış seferleri var.");

            // DriverVehicleAssignment kayıtlarını sil
            var assignments = await _context.DriverVehicleAssignments
                .Where(a => a.DriverId == id)
                .ToListAsync();
            _context.DriverVehicleAssignments.RemoveRange(assignments);

            _context.Drivers.Remove(driver);
            await _context.SaveChangesAsync();
            return true;
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
