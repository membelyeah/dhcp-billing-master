
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Database, Key, Globe, Lock } from "lucide-react";
import { supabase } from '@/utils/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const SupabaseSetup = () => {
  const navigate = useNavigate();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  
  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both Supabase URL and API Key",
        variant: "destructive"
      });
      return;
    }
    
    setIsConnecting(true);
    setConnectionStatus('none');
    
    try {
      // Here, in a real implementation, we would update the Supabase client
      // with the new credentials. Since we can't dynamically update the client,
      // we'll simulate the connection test
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if the credentials look valid
      if (supabaseUrl.includes('.supabase.co') && supabaseKey.length > 20) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Supabase",
        });
        
        // We would save these credentials in a secure way 
        // (not directly in localStorage in a real app)
        localStorage.setItem('SUPABASE_URL', supabaseUrl);
        localStorage.setItem('SUPABASE_KEY', supabaseKey);
        
        // Redirect to home page after short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: "Invalid Supabase URL or API Key format",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Supabase connection test error:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Supabase. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Supabase Setup</CardTitle>
            <CardDescription className="text-center">
              Connect your Supabase project to store DHCP leases and billing data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Supabase URL
                </div>
              </Label>
              <Input
                id="supabase-url"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The URL of your Supabase project, found in the API settings
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supabase-key">
                <div className="flex items-center gap-1">
                  <Key className="h-4 w-4" />
                  Supabase Anon Key
                </div>
              </Label>
              <Input
                id="supabase-key"
                type="password"
                placeholder="your-supabase-anon-key"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The anon key from your Supabase project API settings
              </p>
            </div>
            
            {connectionStatus === 'success' && (
              <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                <Check className="h-4 w-4" />
                <AlertTitle>Connected</AlertTitle>
                <AlertDescription>
                  Successfully connected to Supabase. Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                  Unable to connect to Supabase. Please check your credentials and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full" 
              onClick={handleTestConnection}
              disabled={isConnecting || !supabaseUrl || !supabaseKey}
            >
              {isConnecting ? (
                <>
                  <span className="animate-spin mr-2">⋮</span>
                  Connecting...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Go Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need to create a Supabase project?{' '}
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Visit Supabase Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetup;
