
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Client } from "@/utils/databaseApi";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (client: Client) => void;
  isNew?: boolean;
}

const ClientModal = ({ isOpen, onClose, client, onSave, isNew = false }: ClientModalProps) => {
  const [formData, setFormData] = useState<Client>(
    client || {
      id: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      leaseId: '',
      plan: '',
      monthlyFee: 0,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active'
    }
  );

  const handleChange = (field: keyof Client, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add New Client' : 'Edit Client'}</DialogTitle>
          <DialogDescription>
            {isNew 
              ? 'Enter the details for the new client' 
              : 'Update client information and subscription details'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter client's full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Internet Plan</Label>
            <Select
              value={formData.plan}
              onValueChange={(value) => {
                handleChange('plan', value);
                // Update monthly fee based on selected plan
                const fees = {
                  'Basic 5M': 150000,
                  'Premium 10M': 250000,
                  'Premium Plus 20M': 350000
                };
                handleChange('monthlyFee', fees[value] || 0);
              }}
            >
              <SelectTrigger id="plan">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic 5M">Basic 5M - Rp 150,000/month</SelectItem>
                <SelectItem value="Premium 10M">Premium 10M - Rp 250,000/month</SelectItem>
                <SelectItem value="Premium Plus 20M">Premium Plus 20M - Rp 350,000/month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isNew && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.phone || !formData.plan}>
            {isNew ? 'Add Client' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientModal;
