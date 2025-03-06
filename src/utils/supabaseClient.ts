
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables would normally be used here
const supabaseUrl = 'https://jyxqswiinxqknkpcpkzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5eHFzd2lpbnhxa25rcGNwa3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODkzMzEsImV4cCI6MjA1Njc2NTMzMX0.A1qvXQvZEQcunh2WDcorXI_4MyZpuW6iXLtWp93Zig0';

// Initialize the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
