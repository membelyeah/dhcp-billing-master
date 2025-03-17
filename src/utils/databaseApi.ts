
interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

interface Client {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  leaseId: string;
  plan: string;
  monthlyFee: number;
  registrationDate: string;
  status: 'active' | 'suspended' | 'terminated';
}

interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  dueDate: string;
  method: 'QRIS' | 'Bank Transfer' | 'E-wallet' | 'Cash';
  reference: string;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
}

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  host: '192.168.8.49',
  user: 'billing_user',
  password: 'billing_password',
  database: 'dhcp_billing'
};

class DatabaseAPI {
  private config: DatabaseConfig;
  private mockClients: Client[] = [];
  private mockPayments: Payment[] = [];
  private isConnected = false;

  constructor(config: DatabaseConfig = DEFAULT_DB_CONFIG) {
    this.config = config;
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock clients data
    this.mockClients = [
      {
        id: '1',
        name: 'John Doe',
        address: 'Jl. Sudirman No. 123',
        phone: '081234567890',
        email: 'john.doe@example.com',
        leaseId: '1',
        plan: 'Premium 10M',
        monthlyFee: 250000,
        registrationDate: '2023-01-15',
        status: 'active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        address: 'Jl. Thamrin No. 45',
        phone: '085678901234',
        email: 'jane.smith@example.com',
        leaseId: '2',
        plan: 'Basic 5M',
        monthlyFee: 150000,
        registrationDate: '2023-03-10',
        status: 'active'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        address: 'Jl. Gatot Subroto No. 89',
        phone: '087890123456',
        email: 'bob.johnson@example.com',
        leaseId: '3',
        plan: 'Premium Plus 20M',
        monthlyFee: 350000,
        registrationDate: '2022-11-05',
        status: 'suspended'
      }
    ];

    // Mock payments data
    this.mockPayments = [
      {
        id: '1',
        clientId: '1',
        amount: 250000,
        date: '2023-09-18',
        dueDate: '2023-09-20',
        method: 'Bank Transfer',
        reference: 'INV-202309-001',
        status: 'confirmed'
      },
      {
        id: '2',
        clientId: '2',
        amount: 150000,
        date: '2023-09-19',
        dueDate: '2023-09-20',
        method: 'QRIS',
        reference: 'INV-202309-002',
        status: 'confirmed'
      },
      {
        id: '3',
        clientId: '3',
        amount: 350000,
        date: null,
        dueDate: '2023-09-20',
        method: null,
        reference: 'INV-202309-003',
        status: 'pending'
      }
    ];
  }

  async connect(): Promise<boolean> {
    console.log('Connecting to MySQL database at', this.config.host);
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 800));
      this.isConnected = true;
      console.log('Connected to MySQL database');
      return true;
    } catch (error) {
      console.error('Failed to connect to MySQL database:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getClients(): Promise<Client[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log('Fetching clients from database');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.mockClients;
  }

  async getClient(clientId: string): Promise<Client | null> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Fetching client ${clientId} from database`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const client = this.mockClients.find(c => c.id === clientId);
    return client || null;
  }

  async getPayments(clientId?: string): Promise<Payment[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log('Fetching payments from database');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    if (clientId) {
      return this.mockPayments.filter(p => p.clientId === clientId);
    }
    return this.mockPayments;
  }

  async recordPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log('Recording new payment', payment);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const newPayment: Payment = {
      ...payment,
      id: (this.mockPayments.length + 1).toString()
    };
    
    this.mockPayments.push(newPayment);
    return newPayment;
  }

  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Updating payment ${paymentId} status to ${status}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const paymentIndex = this.mockPayments.findIndex(p => p.id === paymentId);
    if (paymentIndex !== -1) {
      this.mockPayments[paymentIndex].status = status;
      return true;
    }
    
    return false;
  }

  async updateClientStatus(clientId: string, status: Client['status']): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    console.log(`Updating client ${clientId} status to ${status}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const clientIndex = this.mockClients.findIndex(c => c.id === clientId);
    if (clientIndex !== -1) {
      this.mockClients[clientIndex].status = status;
      return true;
    }
    
    return false;
  }

  // Diagnostic methods for debugging
  testConnection(): boolean {
    return this.isConnected;
  }

  simulateCronJob(): string {
    try {
      if (!this.isConnected) {
        return 'ERROR: Database not connected';
      }
      
      // Get all clients with pending payments
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const clientsToBlock = this.mockClients.filter(client => {
        const clientPayments = this.mockPayments.filter(p => p.clientId === client.id);
        const hasPendingPayment = clientsToBlock.some(p => 
          p.status === 'pending' && new Date(p.dueDate) < now
        );
        return hasPendingPayment;
      });
      
      return `Cron job would block ${clientsToBlock.length} clients with overdue payments. Status: Success`;
    } catch (error) {
      return `ERROR: Cron job failed: ${error.message}`;
    }
  }
}

export const databaseApi = new DatabaseAPI();
export type { Client, Payment, DatabaseConfig };
