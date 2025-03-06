import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import StatusCard from "@/components/StatusCard";
import SystemStatus from "@/components/SystemStatus";
import LeaseList from "@/components/LeaseList";
import PaymentManagement from "@/components/PaymentManagement";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, WifiIcon, CreditCard, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Activity, Database, RefreshCw
} from "lucide-react";
import { mikrotikApi } from "@/utils/mikrotikApi";
import { databaseApi } from "@/utils/databaseApi";
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [stats, setStats] = useState({
    totalClients: 0,
    activeLeases: 0,
    pendingPayments: 0,
    blockedClients: 0,
    monthlyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [syncingLeases, setSyncingLeases] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get lease data
        const leases = await mikrotikApi.getLeases();
        const activeLeases = leases.filter(lease => lease.status === 'active').length;
        const blockedClients = leases.filter(lease => lease.status === 'blocked').length;
        
        // Get client and payment data
        const clients = await databaseApi.getClients();
        const payments = await databaseApi.getPayments();
        
        const pendingPayments = payments.filter(payment => payment.status === 'pending').length;
        
        // Calculate monthly revenue (from confirmed payments this month)
        const now = new Date();
        const currentMonthPayments = payments.filter(payment => {
          if (payment.status !== 'confirmed' || !payment.date) return false;
          const paymentDate = new Date(payment.date);
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        });
        
        const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        setStats({
          totalClients: clients.length,
          activeLeases,
          pendingPayments,
          blockedClients,
          monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSyncLeases = async () => {
    setSyncingLeases(true);
    try {
      await mikrotikApi.syncLeasesToDatabase();
      toast({
        title: "Success",
        description: "Leases successfully synchronized with Supabase database",
      });
    } catch (error) {
      console.error('Error synchronizing leases:', error);
      toast({
        title: "Error",
        description: "Failed to synchronize leases. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSyncingLeases(false);
    }
  };
  
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSyncLeases}
          disabled={syncingLeases}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${syncingLeases ? 'animate-spin' : ''}`} />
          Sync Mikrotik Leases
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
          className="animate-slide-in"
          style={{ animationDelay: '0ms' }}
        />
        <StatusCard
          title="Active Connections"
          value={stats.activeLeases}
          description={`${stats.blockedClients} blocked`}
          icon={<WifiIcon className="h-4 w-4" />}
          trend={{ value: 2, isPositive: true }}
          className="animate-slide-in"
          style={{ animationDelay: '100ms' }}
        />
        <StatusCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={<CreditCard className="h-4 w-4" />}
          trend={{ value: 10, isPositive: false }}
          className="animate-slide-in"
          style={{ animationDelay: '200ms' }}
        />
        <StatusCard
          title="Monthly Revenue"
          value={`Rp ${stats.monthlyRevenue.toLocaleString()}`}
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
          className="animate-slide-in"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SystemStatus />
        </div>
        <div>
          <Card className="shadow-sm animate-scale-in">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Quick Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Supabase Integration</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lease data is synchronized with Supabase database for better performance and reliability.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Simplified Packages</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Two package options available: 6M (Rp 100,000) and 10M (Rp 150,000).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-50 text-green-600">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Mikrotik Connection</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connected to your Mikrotik router at hfa09f7ncsn.sn.mynetname.net.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col bg-background antialiased">
      <Header activePage={activePage} onPageChange={setActivePage} />
      
      <main className="flex-1 container py-6">
        {activePage === "dashboard" && renderDashboard()}
        {activePage === "leases" && <LeaseList />}
        {activePage === "payments" && <PaymentManagement />}
      </main>
    </div>
  );
};

export default Index;
