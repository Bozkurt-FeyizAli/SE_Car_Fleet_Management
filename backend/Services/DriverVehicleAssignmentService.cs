using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class DriverVehicleAssignmentService : IDriverVehicleAssignmentService
    {
        private readonly AppDbContext _context;

        public DriverVehicleAssignmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DriverVehicleAssignmentResponse>> GetAllAsync()
        {
            var entities = await _context.DriverVehicleAssignments.ToListAsync();
            return entities.Select(entity => new DriverVehicleAssignmentResponse
            {
                Id = entity.Id,
                DriverId = entity.DriverId,
                VehiclePlate = entity.VehiclePlate
            });
        }

        public async Task<DriverVehicleAssignmentResponse> GetByIdAsync(int id)
        {
            var entity = await _context.DriverVehicleAssignments.FindAsync(id);
            if (entity == null) return null;

            return new DriverVehicleAssignmentResponse
            {
                Id = entity.Id,
                DriverId = entity.DriverId,
                VehiclePlate = entity.VehiclePlate
            };
        }

        public async Task<DriverVehicleAssignmentResponse> CreateAsync(DriverVehicleAssignmentRequest request)
        {
            var entity = new DriverVehicleAssignment
            {
                DriverId = request.DriverId,
                VehiclePlate = request.VehiclePlate
            };

            _context.DriverVehicleAssignments.Add(entity);
            await _context.SaveChangesAsync();

            return new DriverVehicleAssignmentResponse
            {
                Id = entity.Id,
                DriverId = entity.DriverId,
                VehiclePlate = entity.VehiclePlate
            };
        }

        public async Task<bool> UpdateAsync(int id, DriverVehicleAssignmentRequest request)
        {
            var entity = await _context.DriverVehicleAssignments.FindAsync(id);
            if (entity == null) return false;

                        entity.DriverId = request.DriverId;
            entity.VehiclePlate = request.VehiclePlate;

            _context.DriverVehicleAssignments.Update(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.DriverVehicleAssignments.FindAsync(id);
            if (entity == null) return false;

            _context.DriverVehicleAssignments.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
