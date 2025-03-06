
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Clock, RefreshCw, Calendar, AlertCircle, InfoIcon, PlayCircle } from "lucide-react";
import { cronService, type CronTaskResult } from "@/utils/cronService";

const CronManager = () => {
  const [taskHistory, setTaskHistory] = useState<CronTaskResult[]>([]);
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  
  useEffect(() => {
    // Load initial data
    setTaskHistory(cronService.getTaskHistory());
    setLastRunTimes(cronService.getLastRunTimes());
    
    // Update history every 5 seconds (simulating real-time updates)
    const intervalId = setInterval(() => {
      setTaskHistory(cronService.getTaskHistory());
      setLastRunTimes(cronService.getLastRunTimes());
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const runTask = async (taskName: string) => {
    setIsLoading(true);
    
    try {
      let result: CronTaskResult;
      
      switch (taskName) {
        case 'blockUnpaidClients':
          result = await cronService.runBlockUnpaidClientsTask();
          break;
        case 'syncLeases':
          result = await cronService.runSyncLeasesTask();
          break;
        case 'checkPayments':
          result = await cronService.runCheckPaymentsTask();
          break;
        default:
          throw new Error('Unknown task');
      }
      
      // Update state after task completes
      setTaskHistory(cronService.getTaskHistory());
      setLastRunTimes(cronService.getLastRunTimes());
    } catch (error) {
      console.error(`Error running task ${taskName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const getTimeSince = (timestamp: number): string => {
    if (!timestamp) return 'Never run';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds, minutes, hours, days
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };
  
  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>
    );
  };
  
  const simulateCron = () => {
    cronService.simulateDay20Cron();
    // Update history after simulation
    setTaskHistory(cronService.getTaskHistory());
    setLastRunTimes(cronService.getLastRunTimes());
  };
  
  return (
    <Card className="shadow-sm animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Cron Job Manager
        </CardTitle>
        <CardDescription>
          Manage and monitor scheduled tasks for your billing system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Block Unpaid Clients</CardTitle>
                  <CardDescription className="text-xs">
                    Block clients with overdue payments automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last run: {getTimeSince(lastRunTimes.blockUnpaidClients)}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule: Every 20th day of the month
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3">
                  <Button 
                    size="sm" 
                    onClick={() => runTask('blockUnpaidClients')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
                    Run Now
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Sync Mikrotik Leases</CardTitle>
                  <CardDescription className="text-xs">
                    Synchronize DHCP leases from router to database
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last run: {getTimeSince(lastRunTimes.syncLeases)}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule: Every 6 hours
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3">
                  <Button 
                    size="sm" 
                    onClick={() => runTask('syncLeases')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
                    Run Now
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Check Overdue Payments</CardTitle>
                  <CardDescription className="text-xs">
                    Review and mark overdue payments for client suspension
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Last run: {getTimeSince(lastRunTimes.checkPayments)}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule: Daily at midnight
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3">
                  <Button 
                    size="sm" 
                    onClick={() => runTask('checkPayments')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
                    Run Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-600">Simulate Day 20 Cron Job</AlertTitle>
              <AlertDescription className="text-blue-500 text-sm">
                You can test the day 20 blocking process by clicking the button below. 
                This simulates what would happen on the 20th day of the month.
              </AlertDescription>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-blue-200 text-blue-600 hover:bg-blue-100"
                onClick={simulateCron}
              >
                Simulate Day 20 Task
              </Button>
            </Alert>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">No task history found</span>
                          <span className="text-xs text-muted-foreground mt-1">Run a task to see results here</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    taskHistory.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {task.taskName === 'blockUnpaidClients' ? 'Block Unpaid Clients' : 
                           task.taskName === 'syncLeases' ? 'Sync Mikrotik Leases' : 
                           'Check Payments'}
                        </TableCell>
                        <TableCell>{getStatusBadge(task.success)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(task.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          <span className="text-xs text-slate-600">{task.message}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CronManager;
