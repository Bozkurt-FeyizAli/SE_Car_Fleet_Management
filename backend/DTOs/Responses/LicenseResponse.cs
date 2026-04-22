using Backend.Models;

namespace Backend.DTOs
{
    public class LicenseResponse
    {
        public string LicenseNumber { get; set; }
        public string LicenseType { get; set; }

        public LicenseResponse(License license)
        {
            LicenseNumber = license.LicenseNumber;
            LicenseType = license.LicenseType;
        }
    }
}
