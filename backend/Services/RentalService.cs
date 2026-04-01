using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class RentalService : IRentalService
    {
        private readonly AppDbContext _context;
        private readonly IVehicleService _vehicleService;

        public RentalService(AppDbContext context, IVehicleService vehicleService)
        {
            _context = context;
            _vehicleService = vehicleService;
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
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    RentStartKm = vehicle.CurrentKm
                };

                vehicle.Status = "Kirada";
                _context.Vehicles.Update(vehicle);

                _context.Rentals.Add(rental);
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

        public async Task<IEnumerable<RentalResponse>> GetMyRentalsAsync(int companyId)
        {
            var rentals = await _context.Rentals
                .Where(r => r.RenterCompanyId == companyId)
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

                if (rental.ReturnDate.HasValue)
                    throw new Exception("Bu araç zaten iade edilmiş.");

                var vehicle = await _context.Vehicles.FindAsync(rental.VehiclePlate);
                if (vehicle == null)
                    throw new Exception("Araç bulunamadı.");

                rental.ReturnDate = request.ReturnDate;
                
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

                return new RentalResponse(rental);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
