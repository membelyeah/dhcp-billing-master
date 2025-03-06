import { mikrotikApi } from './mikrotikApi';
import { databaseApi } from './databaseApi';
import { toast } from "@/components/ui/use-toast";

interface CronTaskResult {
  taskName: string;
  success: boolean;
  message: string;
  timestamp: string;
  details?: any;
}

class CronService {
  private lastRun: Record<string, number> = {};
  private taskHistory: CronTaskResult[] = [];
  private isRunning = false;
  
  constructor() {
    // Initialize last run times to 0 (never run)
    this.lastRun = {
      'blockUnpaidClients': 0,
      'syncLeases': 0,
      'checkPayments': 0
    };
  }
  
  // Method to manually trigger the block unpaid clients task
  async runBlockUnpaidClientsTask(): Promise<CronTaskResult> {
    if (this.isRunning) {
      return {
        taskName: 'blockUnpaidClients',
        success: false,
        message: 'Another task is already running. Please try again later.',
        timestamp: new Date().toISOString()
      };
    }
    
    this.isRunning = true;
    console.log('Running block unpaid clients cron task');
    
    try {
      // Connect to Mikrotik if not already connected
      const connected = await mikrotikApi.connect();
      if (!connected) {
        throw new Error('Failed to connect to Mikrotik router');
      }
      
      // Run the block unpaid clients task
      const result = await mikrotikApi.blockUnpaidClients();
      
      // Update last run time
      this.lastRun.blockUnpaidClients = Date.now();
      
      // Create task result
      const taskResult: CronTaskResult = {
        taskName: 'blockUnpaidClients',
        success: result.success,
        message: result.success ? 
          `Successfully blocked ${result.blockedCount} unpaid clients` : 
          `Failed to block clients: ${result.errorMessage || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: {
          blockedCount: result.blockedCount,
          error: result.errorMessage
        }
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      // Keep history to last 20 items
      if (this.taskHistory.length > 20) {
        this.taskHistory = this.taskHistory.slice(0, 20);
      }
      
      // Display toast notification
      toast({
        title: result.success ? "Auto-Block Task Completed" : "Auto-Block Task Failed",
        description: taskResult.message,
        variant: result.success ? "default" : "destructive"
      });
      
      return taskResult;
    } catch (error) {
      console.error('Error running block unpaid clients task:', error);
      
      // Create failure task result
      const taskResult: CronTaskResult = {
        taskName: 'blockUnpaidClients',
        success: false,
        message: `Error running block unpaid clients task: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: { error: error.message || 'Unknown error' }
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      
      // Display toast notification
      toast({
        title: "Auto-Block Task Failed",
        description: taskResult.message,
        variant: "destructive"
      });
      
      return taskResult;
    } finally {
      this.isRunning = false;
    }
  }
  
  // Method to manually trigger the sync leases task
  async runSyncLeasesTask(): Promise<CronTaskResult> {
    if (this.isRunning) {
      return {
        taskName: 'syncLeases',
        success: false,
        message: 'Another task is already running. Please try again later.',
        timestamp: new Date().toISOString()
      };
    }
    
    this.isRunning = true;
    console.log('Running sync leases cron task');
    
    try {
      // Connect to Mikrotik if not already connected
      const connected = await mikrotikApi.connect();
      if (!connected) {
        throw new Error('Failed to connect to Mikrotik router');
      }
      
      // Run the sync leases task
      const success = await mikrotikApi.syncLeasesToDatabase();
      
      // Update last run time
      this.lastRun.syncLeases = Date.now();
      
      // Create task result
      const taskResult: CronTaskResult = {
        taskName: 'syncLeases',
        success,
        message: success ? 
          'Successfully synchronized leases with database' : 
          'Failed to synchronize leases with database',
        timestamp: new Date().toISOString()
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      
      return taskResult;
    } catch (error) {
      console.error('Error running sync leases task:', error);
      
      // Create failure task result
      const taskResult: CronTaskResult = {
        taskName: 'syncLeases',
        success: false,
        message: `Error running sync leases task: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: { error: error.message || 'Unknown error' }
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      
      return taskResult;
    } finally {
      this.isRunning = false;
    }
  }
  
  // Method to manually trigger the check payments task
  async runCheckPaymentsTask(): Promise<CronTaskResult> {
    if (this.isRunning) {
      return {
        taskName: 'checkPayments',
        success: false,
        message: 'Another task is already running. Please try again later.',
        timestamp: new Date().toISOString()
      };
    }
    
    this.isRunning = true;
    console.log('Running check payments cron task');
    
    try {
      // Run the overdue payment check
      const result = await databaseApi.runOverduePaymentCheck();
      const success = !result.includes('ERROR');
      
      // Update last run time
      this.lastRun.checkPayments = Date.now();
      
      // Create task result
      const taskResult: CronTaskResult = {
        taskName: 'checkPayments',
        success,
        message: success ? 
          'Successfully checked for overdue payments' : 
          `Failed to check for overdue payments: ${result}`,
        timestamp: new Date().toISOString(),
        details: { result }
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      
      // Display toast notification
      toast({
        title: success ? "Payment Check Completed" : "Payment Check Failed",
        description: taskResult.message,
        variant: success ? "default" : "destructive"
      });
      
      return taskResult;
    } catch (error) {
      console.error('Error running check payments task:', error);
      
      // Create failure task result
      const taskResult: CronTaskResult = {
        taskName: 'checkPayments',
        success: false,
        message: `Error running check payments task: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: { error: error.message || 'Unknown error' }
      };
      
      // Add to history
      this.taskHistory.unshift(taskResult);
      
      return taskResult;
    } finally {
      this.isRunning = false;
    }
  }
  
  // Method to get task history
  getTaskHistory(): CronTaskResult[] {
    return this.taskHistory;
  }
  
  // Method to get last run times
  getLastRunTimes(): Record<string, number> {
    return this.lastRun;
  }
  
  // Method to simulate a cron job that would run on day 20th of each month
  simulateDay20Cron(): void {
    const now = new Date();
    const day = now.getDate();
    
    if (day === 20) {
      // It's the 20th day of the month, run the block unpaid clients task
      this.runBlockUnpaidClientsTask()
        .then(result => {
          console.log('Day 20 cron task completed with result:', result);
        })
        .catch(error => {
          console.error('Error running day 20 cron task:', error);
        });
    } else {
      console.log(`Today is day ${day}, not day 20. Cron task not executed.`);
    }
  }
}

export const cronService = new CronService();
export type { CronTaskResult };
