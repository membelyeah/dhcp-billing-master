import { databaseApi } from './databaseApi';
import { toast } from "@/components/ui/use-toast";

interface RouterConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface Lease {
  id: string;
  address: string;
  macAddress: string;
  clientId: string;
  hostname: string;
  status: 'active' | 'blocked' | 'expired';
  expiryDate: string;
  bandwidth: '6M/3M' | '10M/5M'; 
}

// Using the public domain
const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  host: '192.168.1.7', // Updated to match your configuration
  port: 8728,
  username: 'titikkoma', 
  password: 'titikkoma'
};

class MikrotikAPI {
  private config: RouterConfig;
  private mockLeases: Lease[] = [];
  private isConnected = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private lastConnectionTime = 0;
  private connectionTimeout = 60000; // 1 minute timeout

  constructor(config: RouterConfig = DEFAULT_ROUTER_CONFIG) {
    this.config = config;
    this.initializeMockData();
  }

  private initializeMockData() {
    this.mockLeases = [
      {
        id: '1',
        address: '192.168.1.100',
        macAddress: '00:1A:2B:3C:4D:5E',
        clientId: '01:00:1A:2B:3C:4D:5E',
        hostname: 'client-laptop',
        status: 'active',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        bandwidth: '6M/3M'
      },
      {
        id: '2',
        address: '192.168.1.101',
        macAddress: '11:22:33:44:55:66',
        clientId: '01:11:22:33:44:55:66',
        hostname: 'android-phone',
        status: 'active',
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        bandwidth: '6M/3M'
      },
      {
        id: '3',
        address: '192.168.1.102',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        clientId: '01:AA:BB:CC:DD:EE:FF',
        hostname: 'smart-tv',
        status: 'blocked',
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        bandwidth: '10M/5M'
      }
    ];
  }

  async connect(): Promise<boolean> {
    console.log('Connecting to Mikrotik router at', this.config.host);
    
    // Don't retry too frequently
    const now = Date.now();
    if (this.lastConnectionTime > 0 && (now - this.lastConnectionTime) < this.connectionTimeout) {
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.warn('Too many connection attempts in a short period. Waiting before retrying.');
        return false;
      }
    } else {
      // Reset attempts after timeout period
      this.connectionAttempts = 0;
    }
    
    this.lastConnectionTime = now;
    this.connectionAttempts++;
    
    try {
      // Improved connection logic with timeout
      const connectionPromise = new Promise<boolean>((resolve) => {
        // Simulate connection with better error handling
        setTimeout(() => {
          // Simulate random connection failures for testing (10% chance)
          const isSuccessful = Math.random() > 0.1;
          this.isConnected = isSuccessful;
          console.log(isSuccessful ? 'Connected to Mikrotik router' : 'Failed to connect to Mikrotik router');
          resolve(isSuccessful);
        }, 1000);
      });
      
      // Add timeout for connection attempt
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('Connection attempt timed out');
          resolve(false);
        }, 5000); // 5 second timeout
      });
      
      // Race the connection against the timeout
      return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
      console.error('Failed to connect to Mikrotik router:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getLeases(): Promise<Lease[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log('Fetching DHCP leases');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.mockLeases;
  }

  async blockClient(clientId: string): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Blocking client ${clientId}`);
    // Find and update the client in our mock data
    const leaseIndex = this.mockLeases.findIndex(lease => lease.id === clientId);
    
    if (leaseIndex !== -1) {
      this.mockLeases[leaseIndex].status = 'blocked';
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    return false;
  }

  async unblockClient(clientId: string): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Unblocking client ${clientId}`);
    // Find and update the client in our mock data
    const leaseIndex = this.mockLeases.findIndex(lease => lease.id === clientId);
    
    if (leaseIndex !== -1) {
      this.mockLeases[leaseIndex].status = 'active';
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    return false;
  }

  async setBandwidth(clientId: string, bandwidth: string): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Setting bandwidth for client ${clientId} to ${bandwidth}`);
    // Only allow the two specified bandwidth options
    if (bandwidth !== '6M/3M' && bandwidth !== '10M/5M') {
      console.error('Invalid bandwidth option. Only 6M/3M and 10M/5M are supported.');
      return false;
    }
    
    // Find and update the client in our mock data
    const leaseIndex = this.mockLeases.findIndex(lease => lease.id === clientId);
    
    if (leaseIndex !== -1) {
      this.mockLeases[leaseIndex].bandwidth = bandwidth as '6M/3M' | '10M/5M';
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    return false;
  }

  // Enhanced synchronization method with better error handling and retries
  async syncLeasesToDatabase(retryCount = 0): Promise<boolean> {
    const maxRetries = 3;
    
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected && retryCount < maxRetries) {
        console.log(`Connection attempt failed. Retrying (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return this.syncLeasesToDatabase(retryCount + 1);
      } else if (!connected) {
        console.error('Failed to connect to Mikrotik after multiple attempts');
        toast({
          title: "Connection Error",
          description: "Failed to connect to Mikrotik router after multiple attempts. Please check your router configuration.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    console.log('Synchronizing leases with Supabase database');
    
    try {
      // Fetch the latest lease data from Mikrotik
      const leases = await this.getLeases();
      
      if (leases.length === 0) {
        console.warn('No leases found to synchronize');
        toast({
          title: "Warning",
          description: "No Mikrotik leases found to synchronize. Please check your router configuration.",
          variant: "destructive"
        });
        return false;
      }
      
      // Use the database API to sync the leases to Supabase
      const success = await databaseApi.syncMikrotikLeases(leases);
      
      if (success) {
        toast({
          title: "Success",
          description: `${leases.length} leases successfully synchronized with Supabase database`,
        });
      } else {
        toast({
          title: "Warning",
          description: "Partial success synchronizing leases. Some items may not have updated.",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error synchronizing leases with database:', error);
      
      if (retryCount < maxRetries) {
        console.log(`Sync attempt failed. Retrying (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return this.syncLeasesToDatabase(retryCount + 1);
      }
      
      toast({
        title: "Error",
        description: "Failed to synchronize leases with database after multiple attempts. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Improved method to auto-block clients based on payment status
  async blockUnpaidClients(): Promise<{success: boolean, blockedCount: number, errorMessage?: string}> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        return {
          success: false, 
          blockedCount: 0, 
          errorMessage: "Failed to connect to Mikrotik router"
        };
      }
    }
    
    try {
      console.log('Running automatic blocking for clients with overdue payments');
      
      // Get clients with suspended status (overdue payments)
      const clients = await databaseApi.getClients();
      
      if (!clients || clients.length === 0) {
        return {
          success: false,
          blockedCount: 0,
          errorMessage: "Failed to retrieve clients from database"
        };
      }
      
      const suspendedClients = clients.filter(client => client.status === 'suspended');
      
      if (suspendedClients.length === 0) {
        console.log('No clients to block');
        return { success: true, blockedCount: 0 };
      }
      
      // Block each client in Mikrotik
      let successCount = 0;
      let failedClients = [];
      
      for (const client of suspendedClients) {
        try {
          // Find the lease associated with this client
          const leaseIndex = this.mockLeases.findIndex(lease => lease.id === client.leaseId);
          
          if (leaseIndex !== -1) {
            // Update the status to blocked
            this.mockLeases[leaseIndex].status = 'blocked';
            successCount++;
            
            // Log successful blocking
            console.log(`Successfully blocked client: ${client.name} (ID: ${client.id})`);
          } else {
            failedClients.push({
              id: client.id,
              name: client.name,
              reason: "Lease not found"
            });
            console.warn(`Failed to block client: ${client.name} (ID: ${client.id}) - Lease not found`);
          }
        } catch (error) {
          failedClients.push({
            id: client.id,
            name: client.name,
            reason: "Error during blocking"
          });
          console.error(`Error blocking client ${client.name}:`, error);
        }
      }
      
      console.log(`Successfully blocked ${successCount} of ${suspendedClients.length} clients`);
      
      // Record the blocking operation results to the database for auditing
      try {
        // This would typically call a database function to log the operation
        console.log('Recording blocking operation results for audit');
      } catch (logError) {
        console.error('Error logging blocking operation:', logError);
      }
      
      return { 
        success: successCount > 0, 
        blockedCount: successCount,
        errorMessage: failedClients.length > 0 ? 
          `Failed to block ${failedClients.length} clients` : undefined
      };
    } catch (error) {
      console.error('Error blocking unpaid clients:', error);
      return { 
        success: false, 
        blockedCount: 0,
        errorMessage: `System error: ${error.message || 'Unknown error'}`
      };
    }
  }

  // Enhanced debugging helper for the cron job issue
  testCronJob(): {success: boolean, details: string} {
    console.log('Testing cron job connectivity to Mikrotik at', this.config.host);
    
    if (!this.isConnected) {
      return {
        success: false,
        details: "Not connected to Mikrotik router. Connection must be established first."
      };
    }
    
    // Test the database connection as well
    const dbStatus = databaseApi.testConnection();
    
    if (!dbStatus) {
      return {
        success: false,
        details: "Connected to Mikrotik, but database connection failed. Both connections are required for cron job."
      };
    }
    
    return {
      success: true,
      details: "Mikrotik and database connections verified. Cron job requirements met."
    };
  }
  
  // Add router health check method
  async checkRouterHealth(): Promise<{
    status: 'online' | 'offline' | 'degraded',
    details: string,
    lastChecked: string
  }> {
    const connected = await this.connect();
    
    if (!connected) {
      return {
        status: 'offline',
        details: 'Cannot establish connection to Mikrotik router',
        lastChecked: new Date().toISOString()
      };
    }
    
    try {
      // Simulate checking router resources
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Randomly simulate issues for testing (10% chance)
      const hasIssues = Math.random() < 0.1;
      
      if (hasIssues) {
        return {
          status: 'degraded',
          details: 'Router is online but experiencing high CPU usage or memory constraints',
          lastChecked: new Date().toISOString()
        };
      }
      
      return {
        status: 'online',
        details: 'Router is online and functioning normally',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking router health:', error);
      return {
        status: 'degraded',
        details: `Error during health check: ${error.message || 'Unknown error'}`,
        lastChecked: new Date().toISOString()
      };
    }
  }
}

export const mikrotikApi = new MikrotikAPI();
export type { Lease, RouterConfig };
