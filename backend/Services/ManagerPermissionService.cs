using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class ManagerPermissionService : IManagerPermissionService
    {
        private readonly AppDbContext _context;

        public ManagerPermissionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ManagerPermissionResponse>> GetAllAsync()
        {
            var entities = await _context.ManagerPermissions.ToListAsync();
            return entities.Select(entity => new ManagerPermissionResponse
            {
                Id = entity.Id,
                ManagerId = entity.ManagerId,
                PermissionId = entity.PermissionId
            });
        }

        public async Task<ManagerPermissionResponse> GetByIdAsync(int id)
        {
            var entity = await _context.ManagerPermissions.FindAsync(id);
            if (entity == null) return null;

            return new ManagerPermissionResponse
            {
                Id = entity.Id,
                ManagerId = entity.ManagerId,
                PermissionId = entity.PermissionId
            };
        }

        public async Task<ManagerPermissionResponse> CreateAsync(ManagerPermissionRequest request)
        {
            var entity = new ManagerPermission
            {
                ManagerId = request.ManagerId,
                PermissionId = request.PermissionId
            };

            _context.ManagerPermissions.Add(entity);
            await _context.SaveChangesAsync();

            return new ManagerPermissionResponse
            {
                Id = entity.Id,
                ManagerId = entity.ManagerId,
                PermissionId = entity.PermissionId
            };
        }

        public async Task<bool> UpdateAsync(int id, ManagerPermissionRequest request)
        {
            var entity = await _context.ManagerPermissions.FindAsync(id);
            if (entity == null) return false;

                        entity.ManagerId = request.ManagerId;
            entity.PermissionId = request.PermissionId;

            _context.ManagerPermissions.Update(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.ManagerPermissions.FindAsync(id);
            if (entity == null) return false;

            _context.ManagerPermissions.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
