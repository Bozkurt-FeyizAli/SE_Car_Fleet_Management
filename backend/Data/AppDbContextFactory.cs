using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Backend.Data
{
    /// <summary>
    /// EF Core design-time (migration) araçlarının canlı DB bağlantısı olmadan
    /// DbContext oluşturabilmesi için kullanılır.
    /// </summary>
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

            // Sabit MySQL 8.0 versiyonu — AutoDetect DB'ye bağlanmaya çalışır,
            // bu şekilde migration araçları canlı DB olmadan çalışabilir.
            var connectionString = "Server=localhost;Database=fleet_db;User=fleet_user;Password=123;";

            optionsBuilder.UseMySql(
                connectionString,
                new MySqlServerVersion(new Version(8, 0, 36))
            );

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}
