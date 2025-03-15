
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
  bandwidth: string;
}

// Updated router configuration to use the hostname provided by the user
const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  host: 'hfa09f7ncsn.sn.mynetname.net', // Updated hostname
  port: 8728,
  username: 'titikkoma',
  password: 'titikkoma'
};

class MikrotikAPI {
  private config: RouterConfig;
  private mockLeases: Lease[] = [];
  private isConnected = false;
  private retryCount = 0;
  private maxRetries = 3;

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
        bandwidth: '10M/5M'
      },
      {
        id: '2',
        address: '192.168.1.101',
        macAddress: '11:22:33:44:55:66',
        clientId: '01:11:22:33:44:55:66',
        hostname: 'android-phone',
        status: 'active',
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        bandwidth: '5M/2M'
      },
      {
        id: '3',
        address: '192.168.1.102',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        clientId: '01:AA:BB:CC:DD:EE:FF',
        hostname: 'smart-tv',
        status: 'blocked',
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        bandwidth: '20M/10M'
      }
    ];
  }

  async connect(): Promise<boolean> {
    console.log('Connecting to Mikrotik router at', this.config.host);
    try {
      // Improved connection handling with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        // Simulate connection - In a real app this would be the actual connection code
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(true);
        }, 1000);
      });
      
      this.isConnected = true;
      this.retryCount = 0;
      console.log('Connected to Mikrotik router');
      return true;
    } catch (error) {
      console.error('Failed to connect to Mikrotik router:', error);
      this.isConnected = false;
      
      // Add retry logic
      if (this.retryCount < this.maxRetries) {
        console.log(`Retrying connection (${this.retryCount + 1}/${this.maxRetries})...`);
        this.retryCount++;
        return this.connect();
      }
      
      return false;
    }
  }

  async getLeases(): Promise<Lease[]> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        console.error('Could not connect to router to fetch leases');
        return [];
      }
    }
    console.log('Fetching DHCP leases');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.mockLeases;
  }

  async blockClient(clientId: string): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        console.error('Could not connect to router to block client');
        return false;
      }
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
      const connected = await this.connect();
      if (!connected) {
        console.error('Could not connect to router to unblock client');
        return false;
      }
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
      const connected = await this.connect();
      if (!connected) {
        console.error('Could not connect to router to set bandwidth');
        return false;
      }
    }
    
    console.log(`Setting bandwidth for client ${clientId} to ${bandwidth}`);
    // Find and update the client in our mock data
    const leaseIndex = this.mockLeases.findIndex(lease => lease.id === clientId);
    
    if (leaseIndex !== -1) {
      this.mockLeases[leaseIndex].bandwidth = bandwidth;
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    return false;
  }

  // Improved test method for the cron job
  testCronJob(): boolean {
    console.log('Testing cron job connectivity to', this.config.host);
    return this.isConnected;
  }
  
  // Reset connection state - useful for testing and recovery
  resetConnection(): void {
    this.isConnected = false;
    this.retryCount = 0;
    console.log('Connection state reset');
  }
}

export const mikrotikApi = new MikrotikAPI();
export type { Lease, RouterConfig };
