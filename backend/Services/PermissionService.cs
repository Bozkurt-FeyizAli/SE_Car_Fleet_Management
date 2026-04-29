using Backend.Data;
using Backend.DTOs.Requests;
using Backend.DTOs.Responses;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;

        public PermissionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PermissionResponse>> GetAllAsync()
        {
            var entities = await _context.Permissions.ToListAsync();
            return entities.Select(entity => new PermissionResponse
            {
                Id = entity.Id,
                Name = entity.Name
            });
        }

        public async Task<PermissionResponse> GetByIdAsync(int id)
        {
            var entity = await _context.Permissions.FindAsync(id);
            if (entity == null) return null;

            return new PermissionResponse
            {
                Id = entity.Id,
                Name = entity.Name
            };
        }

        public async Task<PermissionResponse> CreateAsync(PermissionRequest request)
        {
            var entity = new Permission
            {
                Name = request.Name
            };

            _context.Permissions.Add(entity);
            await _context.SaveChangesAsync();

            return new PermissionResponse
            {
                Id = entity.Id,
                Name = entity.Name
            };
        }

        public async Task<bool> UpdateAsync(int id, PermissionRequest request)
        {
            var entity = await _context.Permissions.FindAsync(id);
            if (entity == null) return false;

                        entity.Name = request.Name;

            _context.Permissions.Update(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.Permissions.FindAsync(id);
            if (entity == null) return false;

            _context.Permissions.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
