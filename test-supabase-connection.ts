// Quick test to verify Supabase connection and public profiles access
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jzzbmoopwnvgxxirulga.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emJtb29wd252Z3h4aXJ1bGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDMxMjUsImV4cCI6MjA3NDc3OTEyNX0.5DqetNG0bvN620X8t5QP-sGEInb17ZCgY0Jfp7_qZWU';

const testConnection = async () => {
  try {
    console.log('[TEST] Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('[TEST] Testing connection to profiles table...');
    const { data, error, status } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);
    
    console.log('[TEST] Response status:', status);
    console.log('[TEST] Data received:', data ? `${data.length} record(s)` : 'null');
    console.log('[TEST] Error:', error ? JSON.stringify(error) : 'none');
    
    if (error) {
      console.error('[TEST] Connection failed:', error);
      return false;
    }
    
    console.log('[TEST] ✅ Supabase connection successful');
    return true;
  } catch (err) {
    console.error('[TEST] Exception:', err);
    return false;
  }
};

// Run test
testConnection();
