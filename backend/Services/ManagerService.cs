using Backend.Data;
using Backend.Models;
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
