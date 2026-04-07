namespace Backend.Services.Interfaces
{
    public interface IDriverService
    {
        Task<object> GetDriverPerformanceAsync(int driverId);
    }
}
