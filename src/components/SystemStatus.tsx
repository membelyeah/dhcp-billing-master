
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, AlertCircle, CheckCircle2, RefreshCw, Bug } from "lucide-react";
import { mikrotikApi } from "@/utils/mikrotikApi";
import { databaseApi } from "@/utils/databaseApi";
import { checkSupabaseConnection } from "@/utils/supabaseClient";

const SystemStatus = () => {
  const [activeTab, setActiveTab] = useState("status");
  const [diagnosisResults, setDiagnosisResults] = useState<Record<string, boolean>>({
    mikrotik: false,
    database: false,
    cronJob: false
  });
  const [diagnosisInProgress, setDiagnosisInProgress] = useState(false);
  const [diagnosisProgress, setDiagnosisProgress] = useState(0);
  const [diagnosisMessage, setDiagnosisMessage] = useState("");
  const [detailedDiagnostics, setDetailedDiagnostics] = useState<Record<string, string>>({});
  const [routerHealth, setRouterHealth] = useState<{
    status: 'online' | 'offline' | 'degraded',
    details: string,
    lastChecked: string
  } | null>(null);

  // Run initial diagnosis on component mount
  useEffect(() => {
    const initialCheck = async () => {
      try {
        // Check if database connection is working
        const dbConnected = await checkSupabaseConnection();
        setDiagnosisResults(prev => ({ ...prev, database: dbConnected }));
        
        if (dbConnected) {
          // Only check Mikrotik if database is connected
          const mikrotikConnected = await mikrotikApi.connect();
          setDiagnosisResults(prev => ({ ...prev, mikrotik: mikrotikConnected }));
          
          if (mikrotikConnected) {
            // Only check cron if both are connected
            const cronStatus = mikrotikApi.testCronJob();
            setDiagnosisResults(prev => ({ ...prev, cronJob: cronStatus.success }));
          }
        }
      } catch (error) {
        console.error("Error during initial system check:", error);
      }
    };
    
    initialCheck();
  }, []);

  const runDiagnosis = async () => {
    setDiagnosisInProgress(true);
    setDiagnosisProgress(0);
    setDiagnosisMessage("Starting system diagnostics...");
    setDetailedDiagnostics({});
    
    // Test database connection
    setDiagnosisMessage("Testing database connection...");
    try {
      const dbConnected = await checkSupabaseConnection();
      setDiagnosisResults(prev => ({ ...prev, database: dbConnected }));
      setDiagnosisProgress(33);
      
      const message = dbConnected 
        ? "Supabase connection successful" 
        : "Supabase connection failed - check credentials and network";
        
      setDiagnosisMessage(message);
      setDetailedDiagnostics(prev => ({ 
        ...prev, 
        database: message + (dbConnected ? "" : "\nTry checking the Supabase console and network connectivity")
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      const errorMsg = `Database connection test failed with error: ${error.message || 'Unknown error'}`;
      
      setDiagnosisResults(prev => ({ ...prev, database: false }));
      setDiagnosisProgress(33);
      setDiagnosisMessage("Database connection test failed with error");
      setDetailedDiagnostics(prev => ({ ...prev, database: errorMsg }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test Mikrotik connection
    setDiagnosisMessage("Testing Mikrotik connection...");
    try {
      const mikrotikConnected = await mikrotikApi.connect();
      setDiagnosisResults(prev => ({ ...prev, mikrotik: mikrotikConnected }));
      setDiagnosisProgress(66);
      
      const message = mikrotikConnected 
        ? "Mikrotik connection successful" 
        : "Mikrotik connection failed - check router IP, credentials or firewall";
        
      setDiagnosisMessage(message);
      setDetailedDiagnostics(prev => ({ 
        ...prev, 
        mikrotik: message + (mikrotikConnected ? "" : "\nVerify router IP (192.168.1.7), port (8728), and API credentials")
      }));
      
      // If connected, check router health
      if (mikrotikConnected) {
        const health = await mikrotikApi.checkRouterHealth();
        setRouterHealth(health);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      const errorMsg = `Mikrotik connection test failed with error: ${error.message || 'Unknown error'}`;
      
      setDiagnosisResults(prev => ({ ...prev, mikrotik: false }));
      setDiagnosisProgress(66);
      setDiagnosisMessage("Mikrotik connection test failed with error");
      setDetailedDiagnostics(prev => ({ ...prev, mikrotik: errorMsg }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test cron job
    setDiagnosisMessage("Testing cron job functionality...");
    try {
      // Get test cron job status from Mikrotik API
      const cronJobTest = mikrotikApi.testCronJob();
      setDiagnosisResults(prev => ({ ...prev, cronJob: cronJobTest.success }));
      setDiagnosisProgress(100);
      
      // Ask the database API to run a test of the overdue payment check
      let cronJobDetails = cronJobTest.details;
      
      if (cronJobTest.success) {
        try {
          const overdueCheckResult = await databaseApi.runOverduePaymentCheck();
          cronJobDetails += `\n\nOverdue payment check test results: ${overdueCheckResult}`;
        } catch (dbError) {
          cronJobDetails += `\n\nFailed to test overdue payment check: ${dbError.message || 'Unknown error'}`;
        }
      }
      
      setDiagnosisMessage(cronJobTest.success 
        ? "Cron job test successful" 
        : `Cron job test failed: ${cronJobTest.details}`
      );
      
      setDetailedDiagnostics(prev => ({ 
        ...prev, 
        cronJob: cronJobDetails
      }));
    } catch (error) {
      const errorMsg = `Cron job test failed with error: ${error.message || 'Unknown error'}`;
      
      setDiagnosisResults(prev => ({ ...prev, cronJob: false }));
      setDiagnosisProgress(100);
      setDiagnosisMessage("Cron job test failed with error");
      setDetailedDiagnostics(prev => ({ ...prev, cronJob: errorMsg }));
    }
    
    setDiagnosisInProgress(false);
  };

  const testBlockingFunction = async () => {
    setDiagnosisInProgress(true);
    setDiagnosisMessage("Testing automatic client blocking function...");
    
    try {
      const blockResult = await mikrotikApi.blockUnpaidClients();
      
      if (blockResult.success) {
        setDiagnosisMessage(`Successfully tested blocking function. ${blockResult.blockedCount} clients would be blocked.`);
      } else {
        setDiagnosisMessage(`Failed to test blocking function: ${blockResult.errorMessage}`);
      }
    } catch (error) {
      setDiagnosisMessage(`Error testing blocking function: ${error.message || 'Unknown error'}`);
    } finally {
      setDiagnosisInProgress(false);
    }
  };

  const getDiagnosticDetails = (key: string) => {
    return detailedDiagnostics[key] || "No detailed information available";
  };

  return (
    <Card className="shadow-sm animate-scale-in">
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>
          Check the status of system components and diagnose issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4 mt-4 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Supabase Connection</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  diagnosisResults.database ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {diagnosisResults.database ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Mikrotik Connection</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  diagnosisResults.mikrotik ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {diagnosisResults.mikrotik ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Cron Job</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  diagnosisResults.cronJob ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {diagnosisResults.cronJob ? 'Operational' : 'Issues Detected'}
                </span>
              </div>
              
              {routerHealth && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Router Health</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    routerHealth.status === 'online' ? 'bg-green-50 text-green-600' : 
                    routerHealth.status === 'degraded' ? 'bg-yellow-50 text-yellow-600' : 
                    'bg-red-50 text-red-600'
                  }`}>
                    {routerHealth.status === 'online' ? 'Healthy' : 
                     routerHealth.status === 'degraded' ? 'Degraded' : 'Down'}
                  </span>
                </div>
              )}
            </div>
            
            {Object.values(diagnosisResults).some(result => !result) && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System issues detected</AlertTitle>
                <AlertDescription>
                  One or more system components are not functioning correctly. Run diagnostics for more details.
                </AlertDescription>
              </Alert>
            )}
            
            {Object.values(diagnosisResults).every(result => result) && (
              <Alert className="mt-4 bg-green-50 text-green-600 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>All systems operational</AlertTitle>
                <AlertDescription>
                  All system components are functioning correctly.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                className="flex items-center gap-1 transition-all duration-300"
                onClick={testBlockingFunction}
                disabled={!diagnosisResults.mikrotik || !diagnosisResults.database}
              >
                <Bug className="w-4 h-4" /> Test Blocking
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1 transition-all duration-300"
                onClick={() => setActiveTab("diagnostics")}
              >
                Run Diagnostics <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="diagnostics" className="space-y-4 mt-4 animate-fade-in">
            {diagnosisInProgress ? (
              <div className="space-y-4">
                <div className="text-sm">{diagnosisMessage}</div>
                <Progress value={diagnosisProgress} className="h-2" />
              </div>
            ) : (
              <>
                <div className="text-sm">
                  Run a comprehensive system diagnostics to identify issues with your Supabase connection, Mikrotik connection, and cron job functionality.
                </div>
                
                {diagnosisProgress === 100 && (
                  <div className="space-y-4 mt-4">
                    <h3 className="text-sm font-medium">Diagnostic Results</h3>
                    
                    <div className="space-y-4">
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            diagnosisResults.database ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Supabase Connection</span>
                          <span className="text-xs ml-auto">
                            {diagnosisResults.database ? 'OK' : 'Failed'}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                          {getDiagnosticDetails('database')}
                        </div>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            diagnosisResults.mikrotik ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Mikrotik Connection</span>
                          <span className="text-xs ml-auto">
                            {diagnosisResults.mikrotik ? 'OK' : 'Failed'}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                          {getDiagnosticDetails('mikrotik')}
                        </div>
                      </div>
                      
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            diagnosisResults.cronJob ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">Cron Job Functionality</span>
                          <span className="text-xs ml-auto">
                            {diagnosisResults.cronJob ? 'OK' : 'Failed'}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                          {getDiagnosticDetails('cronJob')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-slate-50 p-3 mt-4">
                      <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {!diagnosisResults.database && (
                          <li>• Periksa Supabase credentials dan koneksi internet</li>
                        )}
                        {!diagnosisResults.mikrotik && (
                          <li>• Verifikasi router IP (192.168.1.7), port (8728), username dan password</li>
                        )}
                        {!diagnosisResults.cronJob && (
                          <li>• Pastikan kedua koneksi (Supabase dan Mikrotik) aktif sebelum menjalankan cron job</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={runDiagnosis}
                    className="transition-all duration-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" /> Start Diagnostics
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
