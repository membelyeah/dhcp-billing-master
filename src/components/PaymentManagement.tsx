
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, RefreshCw, AlertCircle, Plus, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { databaseApi, type Client, type Payment } from "@/utils/databaseApi";

const PaymentManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const [newPayment, setNewPayment] = useState({
    clientId: '',
    amount: '',
    method: '',
    reference: '',
    notes: ''
  });
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsData = await databaseApi.getClients();
      const paymentsData = await databaseApi.getPayments();
      
      setClients(clientsData);
      setPayments(paymentsData);
      
      filterPayments(paymentsData, activeTab, searchTerm);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const filterPayments = (payments: Payment[], tab: string, search: string) => {
    let filtered = [...payments];
    
    // Filter by tab
    if (tab === 'pending') {
      filtered = filtered.filter(payment => payment.status === 'pending');
    } else if (tab === 'confirmed') {
      filtered = filtered.filter(payment => payment.status === 'confirmed');
    }
    
    // Filter by search term
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(payment => {
        const client = clients.find(c => c.id === payment.clientId);
        return (
          client?.name.toLowerCase().includes(searchLower) ||
          payment.reference.toLowerCase().includes(searchLower) ||
          (payment.method && payment.method.toLowerCase().includes(searchLower))
        );
      });
    }
    
    setFilteredPayments(filtered);
  };
  
  useEffect(() => {
    filterPayments(payments, activeTab, searchTerm);
  }, [activeTab, searchTerm, payments, clients]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'pending' | 'confirmed');
  };
  
  const openNewPaymentDialog = () => {
    setNewPayment({
      clientId: '',
      amount: '',
      method: '',
      reference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };
  
  const handleNewPaymentChange = (field: string, value: string) => {
    setNewPayment(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const submitNewPayment = async () => {
    try {
      const selectedClient = clients.find(c => c.id === newPayment.clientId);
      
      if (!selectedClient) {
        console.error('No client selected');
        return;
      }
      
      const amount = parseFloat(newPayment.amount) || selectedClient.monthlyFee;
      
      const payment = await databaseApi.recordPayment({
        clientId: newPayment.clientId,
        amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        method: newPayment.method as 'QRIS' | 'Bank Transfer' | 'E-wallet' | 'Cash',
        reference: newPayment.reference || `INV-${Date.now()}`,
        status: 'pending',
        notes: newPayment.notes
      });
      
      setPayments(prev => [...prev, payment]);
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };
  
  const openConfirmDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsConfirmDialogOpen(true);
  };
  
  const confirmPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const success = await databaseApi.updatePaymentStatus(selectedPayment.id, 'confirmed');
      
      if (success) {
        setPayments(prev => 
          prev.map(p => 
            p.id === selectedPayment.id ? { ...p, status: 'confirmed' } : p
          )
        );
      }
      
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };
  
  const rejectPayment = async () => {
    if (!selectedPayment) return;
    
    try {
      const success = await databaseApi.updatePaymentStatus(selectedPayment.id, 'rejected');
      
      if (success) {
        setPayments(prev => 
          prev.map(p => 
            p.id === selectedPayment.id ? { ...p, status: 'rejected' } : p
          )
        );
      }
      
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };
  
  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <>
      <Card className="shadow-sm animate-scale-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                Track and manage client payments
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={openNewPaymentDialog}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                New Payment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 mb-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by client or reference..."
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
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                        <span className="text-sm text-muted-foreground">Loading payment data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">No payments found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="font-medium">{getClientName(payment.clientId)}</TableCell>
                      <TableCell className="hidden md:table-cell">{payment.reference}</TableCell>
                      <TableCell>Rp {payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{payment.method || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{payment.date || '-'}</TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openConfirmDialog(payment)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          >
                            Confirm
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
            <span>Showing {filteredPayments.length} of {payments.length} payments</span>
            <span className="text-xs">
              {payments.filter(p => p.status === 'pending').length} pending • 
              {' '}{payments.filter(p => p.status === 'confirmed').length} confirmed
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* New Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details for the client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={newPayment.clientId}
                onValueChange={(value) => handleNewPaymentChange('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.plan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder={
                  newPayment.clientId
                    ? `Rp ${clients.find(c => c.id === newPayment.clientId)?.monthlyFee.toLocaleString() || 0}`
                    : "Enter amount"
                }
                value={newPayment.amount}
                onChange={(e) => handleNewPaymentChange('amount', e.target.value)}
              />
              {newPayment.clientId && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to use standard monthly fee (
                  Rp {clients.find(c => c.id === newPayment.clientId)?.monthlyFee.toLocaleString() || 0}
                  )
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={newPayment.method}
                onValueChange={(value) => handleNewPaymentChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="E-wallet">E-wallet</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                placeholder="e.g., Transaction ID, Invoice Number"
                value={newPayment.reference}
                onChange={(e) => handleNewPaymentChange('reference', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional information about this payment"
                value={newPayment.notes}
                onChange={(e) => handleNewPaymentChange('notes', e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewPayment} disabled={!newPayment.clientId || !newPayment.method}>
              <CreditCard className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Payment Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Verify and confirm this payment from {selectedPayment ? getClientName(selectedPayment.clientId) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="font-medium">{getClientName(selectedPayment.clientId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">Rp {selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="font-medium">{selectedPayment.method || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="font-medium">{selectedPayment.reference}</span>
                </div>
                {selectedPayment.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                    <p className="text-sm">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center">
                <Button variant="outline" onClick={() => rejectPayment()} className="text-destructive hover:text-destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={() => confirmPayment()}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentManagement;
