
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables would normally be used here
const supabaseUrl = 'https://your-supabase-project-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

// Initialize the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
