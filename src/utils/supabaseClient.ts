
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables would normally be used here
const supabaseUrl = 'https://jyxqswiinxqknkpcpkzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5eHFzd2lpbnhxa25rcGNwa3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODkzMzEsImV4cCI6MjA1Njc2NTMzMX0.A1qvXQvZEQcunh2WDcorXI_4MyZpuW6iXLtWp93Zig0';

// Initialize the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Add status check function to verify Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('clients').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};
