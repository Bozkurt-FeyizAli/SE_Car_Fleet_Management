using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Manager> Managers { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<ManagerPermission> ManagerPermissions { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<DriverLicense> DriverLicenses { get; set; }
        public DbSet<VehicleRegistration> VehicleRegistrations { get; set; }
        public DbSet<RentalPricingRule> RentalPricingRules { get; set; }
        public DbSet<Rental> Rentals { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // User -> Company (One-to-Many)
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> ParentManager (Self-referencing mapping via Manager)
            modelBuilder.Entity<User>()
                .HasOne(u => u.ParentManager)
                .WithMany(m => m.SubordinateUsers)
                .HasForeignKey(u => u.ParentManagerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Manager Identity Map to User (One-to-One)
            modelBuilder.Entity<Manager>()
                .HasOne(m => m.User)
                .WithOne(u => u.ManagerProfile)
                .HasForeignKey<Manager>(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Driver Identity Map to User (One-to-One)
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.DriverProfile)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Driver License -> Driver (One-to-Many)
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.DriverLicense)
                .WithMany(dl => dl.Drivers)
                .HasForeignKey(d => d.DriverLicenseId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Driver -> Vehicle (One-to-Many)
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.Vehicle)
                .WithMany(v => v.AssignedDrivers)
                .HasForeignKey(d => d.VehiclePlate)
                .OnDelete(DeleteBehavior.SetNull);

            // Vehicle -> VehicleRegistration (One-to-Many)
            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.VehicleRegistration)
                .WithMany(vr => vr.Vehicles)
                .HasForeignKey(v => v.RegistrationNumber)
                .OnDelete(DeleteBehavior.Restrict);

            // Vehicle -> Company (One-to-Many)
            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Company)
                .WithMany(c => c.Vehicles)
                .HasForeignKey(v => v.CompanyId);

            // Rental -> Vehicle (One-to-Many)
            modelBuilder.Entity<Rental>()
                .HasOne(r => r.Vehicle)
                .WithMany(v => v.RentalsAsVehicle)
                .HasForeignKey(r => r.VehiclePlate)
                .OnDelete(DeleteBehavior.Restrict);

            // Rental -> Company (Renter)
            modelBuilder.Entity<Rental>()
                .HasOne(r => r.RenterCompany)
                .WithMany(c => c.RentalsAsRenter)
                .HasForeignKey(r => r.RenterCompanyId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // ManagerPermission mappings
            modelBuilder.Entity<ManagerPermission>()
                .HasOne(mp => mp.Manager)
                .WithMany(m => m.Permissions)
                .HasForeignKey(mp => mp.ManagerId);
                
            modelBuilder.Entity<ManagerPermission>()
                .HasOne(mp => mp.Permission)
                .WithMany(p => p.Managers)
                .HasForeignKey(mp => mp.PermissionId);

            // Seed Permissions
            modelBuilder.Entity<Permission>().HasData(
                new Permission { Id = 1, ActionName = "arac:ekle" },
                new Permission { Id = 2, ActionName = "arac:sil" },
                new Permission { Id = 3, ActionName = "arac:duzenle" },
                new Permission { Id = 4, ActionName = "user:ekle" },
                new Permission { Id = 5, ActionName = "user:sil" },
                new Permission { Id = 6, ActionName = "user:duzenle" },
                new Permission { Id = 7, ActionName = "yetki:ata" },
                new Permission { Id = 8, ActionName = "sofor:olustur" },
                new Permission { Id = 9, ActionName = "sofor:sil" },
                new Permission { Id = 10, ActionName = "sofor:duzenle" },
                new Permission { Id = 11, ActionName = "kira:baslat" },
                new Permission { Id = 12, ActionName = "kira:sonlandir" },
                new Permission { Id = 13, ActionName = "kira:fiyat_guncelle" }
            );

            // Seed RentalPricingRules
            modelBuilder.Entity<RentalPricingRule>().HasData(
                new RentalPricingRule { Id = 1, ParameterName = "km_carpani", Value = 1.05m },
                new RentalPricingRule { Id = 2, ParameterName = "hasarsizlik_indirimi", Value = 0.90m },
                new RentalPricingRule { Id = 3, ParameterName = "yas_faktoru", Value = 1.02m },
                new RentalPricingRule { Id = 4, ParameterName = "taban_fiyat_katsayisi", Value = 1.00m }
            );
        }
    }
}
