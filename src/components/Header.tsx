
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mikrotikApi } from "@/utils/mikrotikApi";
import { databaseApi } from "@/utils/databaseApi";

interface HeaderProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Header = ({ activePage, onPageChange }: HeaderProps) => {
  const [mikrotikStatus, setMikrotikStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const mikrotikConnected = await mikrotikApi.connect();
        setMikrotikStatus(mikrotikConnected ? 'connected' : 'error');
      } catch (error) {
        setMikrotikStatus('error');
      }

      try {
        const dbConnected = await databaseApi.connect();
        setDbStatus(dbConnected ? 'connected' : 'error');
      } catch (error) {
        setDbStatus('error');
      }
    };

    checkConnections();
  }, []);

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="mr-4">
            <h1 className="text-xl font-semibold tracking-tight">DHCP Billing Manager</h1>
          </div>
          <div className="hidden md:flex">
            <Tabs value={activePage} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="dashboard" 
                  onClick={() => onPageChange('dashboard')}
                  className="transition-all duration-300"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="leases" 
                  onClick={() => onPageChange('leases')}
                  className="transition-all duration-300"
                >
                  DHCP Leases
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  onClick={() => onPageChange('payments')}
                  className="transition-all duration-300"
                >
                  Payments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center">
              <div 
                className={`h-2 w-2 rounded-full mr-2 ${
                  mikrotikStatus === 'connected' ? 'bg-green-500' :
                  mikrotikStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} 
              />
              <span className="text-xs text-muted-foreground">Mikrotik</span>
            </div>
            <div className="flex items-center">
              <div 
                className={`h-2 w-2 rounded-full mr-2 ${
                  dbStatus === 'connected' ? 'bg-green-500' :
                  dbStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} 
              />
              <span className="text-xs text-muted-foreground">Database</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="ml-auto transition-all duration-300 hover:bg-primary hover:text-white">
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden px-4 pb-4">
        <Tabs value={activePage} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="dashboard" 
              onClick={() => onPageChange('dashboard')}
              className="transition-all duration-300"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="leases" 
              onClick={() => onPageChange('leases')}
              className="transition-all duration-300"
            >
              Leases
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              onClick={() => onPageChange('payments')}
              className="transition-all duration-300"
            >
              Payments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
};

export default Header;
