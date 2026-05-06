using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    public class FleetHub : Hub
    {
        // Clients can connect to this hub and receive real-time updates.
        // No specific server-to-client methods are strictly required here unless
        // clients want to invoke server methods directly.
        // Currently, we will just use IHubContext<FleetHub> from controllers to broadcast.
    }
}
