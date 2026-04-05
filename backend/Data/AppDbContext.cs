using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Manager> Managers { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<ManagerPermission> ManagerPermissions { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<License> Licenses { get; set; }
        public DbSet<VehicleRegistration> VehicleRegistrations { get; set; }
        public DbSet<RentalPricingRule> RentalPricingRules { get; set; }
        public DbSet<Rental> Rentals { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Trip> Trips { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure DeleteBehavior.Restrict for preventing multiple cascade paths

            // User -> Manager (One-to-One: A user can be a manager)
            modelBuilder.Entity<Manager>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> Driver (One-to-One: A user can be a driver)
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> Company (Many-to-one)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Trip -> Location (Start & End)
            modelBuilder.Entity<Trip>()
                .HasOne(t => t.StartLocation)
                .WithMany()
                .HasForeignKey(t => t.StartLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.EndLocation)
                .WithMany()
                .HasForeignKey(t => t.EndLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Rental -> Company
            modelBuilder.Entity<Rental>()
                .HasOne(r => r.RenterCompany)
                .WithMany()
                .HasForeignKey(r => r.RenterCompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Location -> Company
            modelBuilder.Entity<Location>()
                .HasOne(l => l.Company)
                .WithMany()
                .HasForeignKey(l => l.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
