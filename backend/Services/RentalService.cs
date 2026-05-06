using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class RentalService : IRentalService
    {
        private readonly AppDbContext _context;
        private readonly IVehicleService _vehicleService;
        private readonly IHubContext<FleetHub> _hubContext;

        public RentalService(AppDbContext context, IVehicleService vehicleService, IHubContext<FleetHub> hubContext)
        {
            _context = context;
            _vehicleService = vehicleService;
            _hubContext = hubContext;
        }

        public async Task<RentalResponse> CreateRentalRequestAsync(RentalRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(request.VehiclePlate);
                if (vehicle == null)
                    throw new Exception("Araç bulunamadı.");

                if (vehicle.Status != "Müsait")
                    throw new Exception("Araç şu anda müsait değil.");

                var rental = new Rental
                {
                    VehiclePlate = request.VehiclePlate,
                    RenterCompanyId = request.RenterCompanyId,
                    RentedCompanyId = request.RentedCompanyId != 0 ? request.RentedCompanyId : vehicle.CompanyId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    RentStartKm = vehicle.CurrentKm,
                    Status = "Pending"
                };

                vehicle.Status = "Rezerve";
                _context.Vehicles.Update(vehicle);

                _context.Rentals.Add(rental);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Broadcast RentalCreated event
                await _hubContext.Clients.All.SendAsync("RentalCreated", new { 
                    VehiclePlate = rental.VehiclePlate, 
                    RenterCompanyId = rental.RenterCompanyId 
                });

                return new RentalResponse(rental);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<RentalResponse>> GetMyRentalsAsync(int companyId)
        {
            var rentals = await _context.Rentals
                .Include(r => r.Vehicle).ThenInclude(v => v.Company)
                .Include(r => r.RenterCompany)
                .Include(r => r.RentedCompany)
                .Where(r => r.RenterCompanyId == companyId || r.RentedCompanyId == companyId)
                .ToListAsync();

            return rentals.Select(r => new RentalResponse(r));
        }

        public async Task<IEnumerable<RentalResponse>> GetAllRentalsAsync()
        {
            var rentals = await _context.Rentals
                .Include(r => r.Vehicle).ThenInclude(v => v.Company)
                .Include(r => r.RenterCompany)
                .Include(r => r.RentedCompany)
                .ToListAsync();

            return rentals.Select(r => new RentalResponse(r));
        }

        public async Task<RentalResponse> ReturnVehicleAsync(int rentalId, ReturnRentalRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var rental = await _context.Rentals.FindAsync(rentalId);
                if (rental == null)
                    throw new Exception("Kiralama kaydı bulunamadı.");

                if (rental.Status != "Approved")
                    throw new Exception("Sadece onaylanmış kiralamalar iade edilebilir.");

                if (rental.ReturnDate.HasValue)
                    throw new Exception("Bu araç zaten iade edilmiş.");

                var vehicle = await _context.Vehicles.FindAsync(rental.VehiclePlate);
                if (vehicle == null)
                    throw new Exception("Araç bulunamadı.");

                rental.ReturnDate = request.ReturnDate;
                rental.IsCompleted = true;
                rental.Status = "Completed";
                
                int rentedDays = (request.ReturnDate.Date - rental.StartDate.Date).Days;
                if (rentedDays <= 0) rentedDays = 1;

                var priceCalc = await _vehicleService.CalculatePriceAsync(rental.VehiclePlate, rentedDays);
                
                decimal calculatedPrice = priceCalc != null ? priceCalc.TotalEstimatedPrice : 0;
                
                if (request.ReturnDate.Date > rental.EndDate.Date)
                {
                    int delayDays = (request.ReturnDate.Date - rental.EndDate.Date).Days;
                    decimal delayPenaltyPerDay = priceCalc != null ? priceCalc.FinalPricePerDay * 1.5m : 0;
                    calculatedPrice += (delayDays * delayPenaltyPerDay);
                }

                rental.TotalPrice = calculatedPrice;

                vehicle.Status = "Müsait";
                if (request.ReturnKm > vehicle.CurrentKm)
                {
                    vehicle.CurrentKm = request.ReturnKm;
                }
                
                _context.Rentals.Update(rental);
                _context.Vehicles.Update(vehicle);
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _hubContext.Clients.All.SendAsync("VehicleReturned", new { 
                    RentalId = rental.Id, 
                    VehiclePlate = rental.VehiclePlate 
                });

                return new RentalResponse(rental);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<RentalResponse> ApproveRentalAsync(int rentalId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var rental = await _context.Rentals
                    .Include(r => r.Vehicle).ThenInclude(v => v.Company)
                    .Include(r => r.RenterCompany)
                    .Include(r => r.RentedCompany)
                    .FirstOrDefaultAsync(r => r.Id == rentalId);

                if (rental == null) throw new Exception("Kiralama bulunamadı.");
                if (rental.Status != "Pending") throw new Exception("Kiralama zaten onaylanmış veya reddedilmiş.");

                rental.Status = "Approved";

                if (rental.Vehicle != null)
                {
                    rental.Vehicle.Status = "Kirada";
                    _context.Vehicles.Update(rental.Vehicle);
                }

                _context.Rentals.Update(rental);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new RentalResponse(rental);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<RentalResponse> RejectRentalAsync(int rentalId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var rental = await _context.Rentals
                    .Include(r => r.Vehicle).ThenInclude(v => v.Company)
                    .Include(r => r.RenterCompany)
                    .Include(r => r.RentedCompany)
                    .FirstOrDefaultAsync(r => r.Id == rentalId);

                if (rental == null) throw new Exception("Kiralama bulunamadı.");
                if (rental.Status != "Pending") throw new Exception("Kiralama zaten onaylanmış veya reddedilmiş.");

                rental.Status = "Rejected";

                if (rental.Vehicle != null)
                {
                    rental.Vehicle.Status = "Müsait";
                    _context.Vehicles.Update(rental.Vehicle);
                }

                _context.Rentals.Update(rental);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new RentalResponse(rental);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<RentalResponse?> GetRentalByIdAsync(int id)
        {
            var rental = await _context.Rentals
                .Include(r => r.Vehicle).ThenInclude(v => v.Company)
                .Include(r => r.RenterCompany)
                .Include(r => r.RentedCompany)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rental == null) return null;
            return new RentalResponse(rental);
        }

        public async Task<bool> UpdateRentalAsync(int id, RentalRequest request)
        {
            var rental = await _context.Rentals.FindAsync(id);
            if (rental == null) return false;

            rental.VehiclePlate = request.VehiclePlate;
            rental.RenterCompanyId = request.RenterCompanyId;
            if (request.RentedCompanyId != 0) rental.RentedCompanyId = request.RentedCompanyId;
            rental.StartDate = request.StartDate;
            rental.EndDate = request.EndDate;
            rental.RentStartKm = request.RentStartKm;

            _context.Rentals.Update(rental);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRentalAsync(int id)
        {
            var rental = await _context.Rentals.FindAsync(id);
            if (rental == null) return false;

            _context.Rentals.Remove(rental);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
