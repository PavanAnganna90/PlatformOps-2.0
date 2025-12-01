import { createClient } from '@supabase/supabase-js';

// Helper to get env vars regardless of the build tool (Vite, CRA, Next.js)
const getEnv = (key: string) => {
  // Check for Vite
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const viteVal = import.meta.env[`VITE_${key}`];
    if (viteVal) return viteVal;
  }

  // Check for Create React App or standard process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`] || 
           process.env[`NEXT_PUBLIC_${key}`] || 
           process.env[key];
  }
  
  return '';
};

// We check for specific URL/Key combos, and also generic SUPABASE_KEY as requested
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY');

// Debugging log (visible in browser console)
console.log(`Supabase Config: URL=${supabaseUrl ? 'Set' : 'Missing'}, Key=${supabaseAnonKey ? 'Set' : 'Missing'}`);

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;