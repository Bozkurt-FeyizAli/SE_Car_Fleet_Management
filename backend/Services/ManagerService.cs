using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class ManagerService : IManagerService
    {
        private readonly AppDbContext _context;

        public ManagerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ManagerResponse>> GetAllManagersAsync()
        {
            var managers = await _context.Managers.ToListAsync();
            return managers.Select(m => new ManagerResponse(m));
        }

        public async Task<ManagerResponse?> GetManagerByIdAsync(int id)
        {
            var manager = await _context.Managers.FirstOrDefaultAsync(m => m.Id == id);
            if (manager == null) return null;
            return new ManagerResponse(manager);
        }

        public async Task<ManagerResponse> CreateManagerAsync(ManagerRequest request)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
                throw new Exception("Kullanıcı bulunamadı.");

            var existingManager = await _context.Managers.AnyAsync(m => m.UserId == request.UserId);
            if (existingManager)
                throw new Exception("Bu kullanıcı zaten bir yönetici olarak kayıtlı.");

            var manager = new Manager
            {
                UserId = request.UserId,
                DepartmentName = request.DepartmentName,
                OfficeNumber = request.OfficeNumber
            };

            // Process Permissions if provided
            if (request.PermissionIds != null && request.PermissionIds.Any())
            {
                foreach (var permId in request.PermissionIds)
                {
                    var permissionExists = await _context.Permissions.AnyAsync(p => p.Id == permId);
                    if (permissionExists)
                    {
                        manager.Permissions.Add(new ManagerPermission
                        {
                            Manager = manager,
                            PermissionId = permId
                        });
                    }
                }
            }

            _context.Managers.Add(manager);
            await _context.SaveChangesAsync();

            return new ManagerResponse(manager);
        }

        public async Task<bool> UpdateManagerAsync(int id, ManagerRequest request)
        {
            var manager = await _context.Managers
                .Include(m => m.Permissions)
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (manager == null) return false;

            manager.UserId = request.UserId;
            manager.DepartmentName = request.DepartmentName;
            manager.OfficeNumber = request.OfficeNumber;

            // Update permissions
            if (request.PermissionIds != null)
            {
                _context.ManagerPermissions.RemoveRange(manager.Permissions);
                
                foreach (var permId in request.PermissionIds)
                {
                    var permissionExists = await _context.Permissions.AnyAsync(p => p.Id == permId);
                    if (permissionExists)
                    {
                        manager.Permissions.Add(new ManagerPermission
                        {
                            ManagerId = manager.Id,
                            PermissionId = permId
                        });
                    }
                }
            }

            _context.Managers.Update(manager);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteManagerAsync(int id)
        {
            var manager = await _context.Managers
                .Include(m => m.Permissions)
                .FirstOrDefaultAsync(m => m.Id == id);
                
            if (manager == null) return false;

            // Remove related manager permissions first due to FK constraints
            _context.ManagerPermissions.RemoveRange(manager.Permissions);
            
            // Note: Users that have this manager as ParentManagerId might need to be updated.
            var subordinates = await _context.Users.Where(u => u.ParentManagerId == id).ToListAsync();
            foreach (var sub in subordinates)
            {
                sub.ParentManagerId = null;
            }

            _context.Managers.Remove(manager);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Permission>> GetManagerPermissionsAsync(int managerId)
        {
            var manager = await _context.Managers
                .Include(m => m.Permissions)
                .ThenInclude(mp => mp.Permission)
                .FirstOrDefaultAsync(m => m.Id == managerId);

            if (manager == null) return Enumerable.Empty<Permission>();

            return manager.Permissions.Select(mp => mp.Permission!).Where(p => p != null);
        }
    }
}
