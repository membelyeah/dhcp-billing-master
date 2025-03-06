
import { supabase } from './supabaseClient';
import { toast } from "@/components/ui/use-toast";

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

class DatabaseAPI {
  private isConnected = false;

  async connect(): Promise<boolean> {
    console.log('Connecting to Supabase');
    try {
      // Test connection by getting a small amount of data
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      this.isConnected = true;
      console.log('Connected to Supabase');
      return true;
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      this.isConnected = false;
      toast({
        title: "Connection Error",
        description: "Failed to connect to the database. Please check your connection.",
        variant: "destructive"
      });
      return false;
    }
  }

  async getClients(): Promise<Client[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log('Fetching clients from database');
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our Client interface
      return data.map(client => ({
        id: client.id,
        name: client.name,
        address: client.address,
        phone: client.phone,
        email: client.email,
        leaseId: client.lease_id,
        plan: client.plan,
        monthlyFee: client.monthly_fee,
        registrationDate: client.registration_date,
        status: client.status as Client['status']
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }

  async getClient(clientId: string): Promise<Client | null> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log(`Fetching client ${clientId} from database`);
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        leaseId: data.lease_id,
        plan: data.plan,
        monthlyFee: data.monthly_fee,
        registrationDate: data.registration_date,
        status: data.status as Client['status']
      };
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  async getPayments(clientId?: string): Promise<Payment[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log('Fetching payments from database');
    
    try {
      let query = supabase.from('payments').select('*');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data.map(payment => ({
        id: payment.id,
        clientId: payment.client_id,
        amount: payment.amount,
        date: payment.date || new Date().toISOString().split('T')[0],
        dueDate: payment.due_date,
        method: payment.method as Payment['method'],
        reference: payment.reference,
        status: payment.status as Payment['status'],
        notes: payment.notes || undefined
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }

  async recordPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log('Recording new payment', payment);
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          client_id: payment.clientId,
          amount: payment.amount,
          date: payment.date,
          due_date: payment.dueDate,
          method: payment.method,
          reference: payment.reference,
          status: payment.status,
          notes: payment.notes || null
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      
      return {
        id: data.id,
        clientId: data.client_id,
        amount: data.amount,
        date: data.date || new Date().toISOString().split('T')[0],
        dueDate: data.due_date,
        method: data.method as Payment['method'],
        reference: data.reference,
        status: data.status as Payment['status'],
        notes: data.notes || undefined
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }

  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log(`Updating payment ${paymentId} status to ${status}`);
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Payment status updated to ${status}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  async updateClientStatus(clientId: string, status: Client['status']): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log(`Updating client ${clientId} status to ${status}`);
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status })
        .eq('id', clientId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Client status updated to ${status}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        title: "Error",
        description: "Failed to update client status. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }
  
  // Method to synchronize Mikrotik leases with Supabase
  async syncMikrotikLeases(leases: any[]): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    console.log('Synchronizing Mikrotik leases with Supabase');
    
    try {
      // First get all existing leases to determine updates vs inserts
      const { data: existingLeases, error: fetchError } = await supabase
        .from('mikrotik_leases')
        .select('id');
      
      if (fetchError) {
        throw fetchError;
      }
      
      const existingLeaseIds = new Set(existingLeases.map(lease => lease.id));
      const now = new Date().toISOString();
      
      // Prepare upsert operation
      const leaseData = leases.map(lease => ({
        id: lease.id,
        address: lease.address,
        mac_address: lease.macAddress,
        client_id: lease.clientId,
        hostname: lease.hostname,
        status: lease.status,
        expiry_date: lease.expiryDate,
        bandwidth: lease.bandwidth,
        last_synced: now
      }));
      
      // Upsert leases
      const { error: upsertError } = await supabase
        .from('mikrotik_leases')
        .upsert(leaseData);
      
      if (upsertError) {
        throw upsertError;
      }
      
      toast({
        title: "Success",
        description: `${leaseData.length} leases synchronized with the database`,
      });
      
      return true;
    } catch (error) {
      console.error('Error synchronizing leases:', error);
      toast({
        title: "Error",
        description: "Failed to synchronize leases with database. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Implement cron job simulation
  async runOverduePaymentCheck(): Promise<string> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Find clients with pending payments that are past due
      const { data: overduePayments, error: paymentError } = await supabase
        .from('payments')
        .select('client_id')
        .eq('status', 'pending')
        .lt('due_date', today);
      
      if (paymentError) {
        throw paymentError;
      }
      
      // Get unique client IDs
      const clientIds = [...new Set(overduePayments.map(p => p.client_id))];
      
      if (clientIds.length === 0) {
        return 'No clients with overdue payments found.';
      }
      
      // Update client status to suspended
      const { error: updateError } = await supabase
        .from('clients')
        .update({ status: 'suspended' })
        .in('id', clientIds);
      
      if (updateError) {
        throw updateError;
      }
      
      return `Successfully processed ${clientIds.length} clients with overdue payments.`;
    } catch (error) {
      console.error('Error in overdue payment check:', error);
      return `ERROR: Failed to process overdue payments: ${error.message}`;
    }
  }

  // Diagnostic methods for debugging
  testConnection(): boolean {
    return this.isConnected;
  }
}

export const databaseApi = new DatabaseAPI();
export type { Client, Payment };
