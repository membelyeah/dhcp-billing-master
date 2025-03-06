
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
  bandwidth: '6M/3M' | '10M/5M'; // Updated to match the two package options
}

// Updated to use the public domain
const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  host: 'af2442995f3a6456.sn.mynetname.net',
  port: 8728,
  username: 'titikkoma',
  password: 'titikkoma'
};

class MikrotikAPI {
  private config: RouterConfig;
  private mockLeases: Lease[] = [];
  private isConnected = false;

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
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.isConnected = true;
      console.log('Connected to Mikrotik router');
      return true;
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

  // Add a method to synchronize leases with Supabase database
  async syncLeasesToDatabase(): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log('Synchronizing leases with Supabase database');
    
    try {
      // In a real implementation, this would send the leases to Supabase
      // For now, we'll just log it and return true
      const leases = await this.getLeases();
      console.log('Leases to sync with database:', leases);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return true;
    } catch (error) {
      console.error('Error synchronizing leases with database:', error);
      return false;
    }
  }

  // Debugging helper for the cron job issue
  testCronJob(): boolean {
    console.log('Testing cron job connectivity to Mikrotik at', this.config.host);
    return this.isConnected;
  }
}

export const mikrotikApi = new MikrotikAPI();
export type { Lease, RouterConfig };
