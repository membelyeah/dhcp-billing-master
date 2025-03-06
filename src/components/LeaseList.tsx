import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search, RefreshCw, Ban, Check, Wifi } from "lucide-react";
import { mikrotikApi, type Lease } from "@/utils/mikrotikApi";
import { databaseApi, type Client } from "@/utils/databaseApi";

const LeaseList = () => {
  const [leases, setLeases] = useState<Array<Lease & { client?: Client }>>([]);
  const [filteredLeases, setFilteredLeases] = useState<Array<Lease & { client?: Client }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLease, setSelectedLease] = useState<(Lease & { client?: Client }) | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bandwidthValue, setBandwidthValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchLeases = async () => {
    setLoading(true);
    try {
      const leaseData = await mikrotikApi.getLeases();
      const clientData = await databaseApi.getClients();
      
      // Merge lease data with client data
      const mergedData = leaseData.map(lease => {
        const matchingClient = clientData.find(client => client.leaseId === lease.id);
        return {
          ...lease,
          client: matchingClient
        };
      });
      
      setLeases(mergedData);
      setFilteredLeases(mergedData);
    } catch (error) {
      console.error('Error fetching leases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeases(leases);
    } else {
      const filtered = leases.filter(lease => 
        lease.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeases(filtered);
    }
  }, [searchTerm, leases]);

  const handleLeaseClick = (lease: Lease & { client?: Client }) => {
    setSelectedLease(lease);
    setBandwidthValue(lease.bandwidth);
    setIsDialogOpen(true);
  };

  const handleBlockUnblock = async () => {
    if (!selectedLease) return;
    
    setIsUpdating(true);
    try {
      let success;
      if (selectedLease.status === 'blocked') {
        success = await mikrotikApi.unblockClient(selectedLease.id);
      } else {
        success = await mikrotikApi.blockClient(selectedLease.id);
      }
      
      if (success) {
        setLeases(prevLeases => 
          prevLeases.map(lease => 
            lease.id === selectedLease.id 
              ? { 
                  ...lease, 
                  status: lease.status === 'blocked' ? 'active' : 'blocked' 
                } 
              : lease
          )
        );
        setSelectedLease(prev => 
          prev 
            ? { 
                ...prev, 
                status: prev.status === 'blocked' ? 'active' : 'blocked' 
              } 
            : null
        );
      }
    } catch (error) {
      console.error('Error updating client status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetBandwidth = async () => {
    if (!selectedLease || !bandwidthValue) return;
    
    setIsUpdating(true);
    try {
      const success = await mikrotikApi.setBandwidth(selectedLease.id, bandwidthValue);
      
      if (success) {
        setLeases(prevLeases => 
          prevLeases.map(lease => 
            lease.id === selectedLease.id 
              ? { ...lease, bandwidth: bandwidthValue as '6M/3M' | '10M/5M' } 
              : lease
          )
        );
        setSelectedLease(prev => 
          prev ? { ...prev, bandwidth: bandwidthValue as '6M/3M' | '10M/5M' } : null
        );
      }
    } catch (error) {
      console.error('Error setting bandwidth:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Blocked</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <Card className="shadow-sm animate-scale-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DHCP Leases</CardTitle>
              <CardDescription>
                Manage DHCP leases and client connections
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeases}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by hostname, IP, or MAC address..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="hidden md:table-cell">MAC Address</TableHead>
                  <TableHead className="hidden md:table-cell">Bandwidth</TableHead>
                  <TableHead className="hidden lg:table-cell">Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                        <span className="text-sm text-muted-foreground">Loading lease data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">No leases found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeases.map((lease) => (
                    <TableRow 
                      key={lease.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                      onClick={() => handleLeaseClick(lease)}
                    >
                      <TableCell>{getStatusBadge(lease.status)}</TableCell>
                      <TableCell className="font-medium">{lease.hostname || 'Unknown'}</TableCell>
                      <TableCell>{lease.address}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {lease.macAddress}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {lease.bandwidth}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lease.client ? (
                          <span className="text-sm">{lease.client.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Lease Details Dialog - update the bandwidth options */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lease Details</DialogTitle>
            <DialogDescription>
              View and manage lease for {selectedLease?.hostname || 'Unknown device'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLease && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">IP Address</label>
                  <div className="font-medium">{selectedLease.address}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <div>{getStatusBadge(selectedLease.status)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hostname</label>
                  <div className="font-medium">{selectedLease.hostname || 'Unknown'}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">MAC Address</label>
                  <div className="font-mono text-xs">{selectedLease.macAddress}</div>
                </div>
              </div>
              
              {selectedLease.client && (
                <div className="border-t pt-4 mt-4">
                  <label className="text-xs text-muted-foreground mb-2 block">Client Information</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Name</label>
                      <div className="font-medium">{selectedLease.client.name}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Plan</label>
                      <div className="font-medium">{selectedLease.client.plan}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Payment Status</label>
                      <div>
                        <Badge 
                          className={selectedLease.client.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {selectedLease.client.status === 'active' ? 'Paid' : 'Due'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Monthly Fee</label>
                      <div className="font-medium">
                        Rp {selectedLease.client.monthlyFee.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Set Bandwidth</label>
                  <div className="flex gap-2">
                    <Select
                      value={bandwidthValue}
                      onValueChange={setBandwidthValue}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select bandwidth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6M/3M">6M/3M - Rp 100.000</SelectItem>
                        <SelectItem value="10M/5M">10M/5M - Rp 150.000</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={handleSetBandwidth}
                      disabled={isUpdating || bandwidthValue === selectedLease.bandwidth}
                    >
                      <Wifi className="h-4 w-4 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant={selectedLease.status === 'blocked' ? 'default' : 'destructive'}
                    onClick={handleBlockUnblock}
                    disabled={isUpdating}
                  >
                    {selectedLease.status === 'blocked' ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-1" />
                        Block
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeaseList;
