
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkSupabaseConnection } from '@/utils/supabaseClient';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [dbConnectionOk, setDbConnectionOk] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setCheckingConnection(true);
        const isConnected = await checkSupabaseConnection();
        setDbConnectionOk(isConnected);
      } catch (error) {
        console.error('Error checking database connection:', error);
        setDbConnectionOk(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  const retryDbConnection = async () => {
    setCheckingConnection(true);
    try {
      const isConnected = await checkSupabaseConnection();
      setDbConnectionOk(isConnected);
    } catch (error) {
      console.error('Error checking database connection:', error);
      setDbConnectionOk(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  if (loading || checkingConnection) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">
            {loading ? 'Checking authentication...' : 'Checking database connection...'}
          </p>
        </div>
      </div>
    );
  }

  // If database connection fails, show error
  if (dbConnectionOk === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md mx-auto p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>
              Failed to connect to the Supabase database. Please check your credentials and network connection.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-center">
            <Button onClick={retryDbConnection} variant="outline" className="mr-2">
              {checkingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Retry Connection
            </Button>
            <Button onClick={() => navigate('/auth')}>Back to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
