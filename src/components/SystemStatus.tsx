
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { mikrotikApi } from "@/utils/mikrotikApi";
import { databaseApi } from "@/utils/databaseApi";

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

  const runDiagnosis = async () => {
    setDiagnosisInProgress(true);
    setDiagnosisProgress(0);
    setDiagnosisMessage("Starting system diagnostics...");
    
    // Test Mikrotik connection
    setDiagnosisMessage("Testing Mikrotik connection...");
    try {
      const mikrotikConnected = await mikrotikApi.connect();
      setDiagnosisResults(prev => ({ ...prev, mikrotik: mikrotikConnected }));
      setDiagnosisProgress(33);
      setDiagnosisMessage(mikrotikConnected 
        ? "Mikrotik connection successful" 
        : "Mikrotik connection failed"
      );
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      setDiagnosisResults(prev => ({ ...prev, mikrotik: false }));
      setDiagnosisProgress(33);
      setDiagnosisMessage("Mikrotik connection test failed with error");
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test database connection
    setDiagnosisMessage("Testing database connection...");
    try {
      const dbConnected = await databaseApi.connect();
      setDiagnosisResults(prev => ({ ...prev, database: dbConnected }));
      setDiagnosisProgress(66);
      setDiagnosisMessage(dbConnected 
        ? "Database connection successful" 
        : "Database connection failed"
      );
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      setDiagnosisResults(prev => ({ ...prev, database: false }));
      setDiagnosisProgress(66);
      setDiagnosisMessage("Database connection test failed with error");
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test cron job
    setDiagnosisMessage("Testing cron job functionality...");
    try {
      // Get test cron job status from database API
      const cronJobStatus = databaseApi.simulateCronJob();
      const cronJobSuccess = !cronJobStatus.includes("ERROR");
      setDiagnosisResults(prev => ({ ...prev, cronJob: cronJobSuccess }));
      setDiagnosisProgress(100);
      setDiagnosisMessage(cronJobSuccess 
        ? "Cron job test successful" 
        : `Cron job test failed: ${cronJobStatus}`
      );
    } catch (error) {
      setDiagnosisResults(prev => ({ ...prev, cronJob: false }));
      setDiagnosisProgress(100);
      setDiagnosisMessage("Cron job test failed with error");
    }
    
    setDiagnosisInProgress(false);
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
                <span className="text-sm">Mikrotik Connection</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  diagnosisResults.mikrotik ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {diagnosisResults.mikrotik ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  diagnosisResults.database ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {diagnosisResults.database ? 'Connected' : 'Disconnected'}
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
            
            <div className="flex justify-end mt-4">
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
                  Run a comprehensive system diagnostics to identify issues with your Mikrotik connection, database, and cron job functionality.
                </div>
                
                {diagnosisProgress === 100 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="text-sm font-medium">Diagnostic Results</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          diagnosisResults.mikrotik ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">Mikrotik Connection</span>
                        <span className="text-xs ml-auto">
                          {diagnosisResults.mikrotik ? 'OK' : 'Failed'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          diagnosisResults.database ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">Database Connection</span>
                        <span className="text-xs ml-auto">
                          {diagnosisResults.database ? 'OK' : 'Failed'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          diagnosisResults.cronJob ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">Cron Job Functionality</span>
                        <span className="text-xs ml-auto">
                          {diagnosisResults.cronJob ? 'OK' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={runDiagnosis}
                    className="transition-all duration-300"
                  >
                    Start Diagnostics
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
