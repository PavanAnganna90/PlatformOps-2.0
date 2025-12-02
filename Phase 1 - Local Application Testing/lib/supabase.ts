import { createClient } from '@supabase/supabase-js';

// Explicitly access environment variables to ensure Vite's static replacement works.
// We prioritize variables injected by Vite's `define` in vite.config.ts.

// @ts-ignore
const env = typeof process !== 'undefined' && process.env ? process.env : {};

// Access keys directly so the bundler can replace "process.env.REACT_APP_SUPABASE_URL" with the string literal.
// We use a fallback chain for robustness.
const supabaseUrl = 
  // @ts-ignore
  process.env.REACT_APP_SUPABASE_URL || 
  // @ts-ignore
  process.env.VITE_SUPABASE_URL ||
  // @ts-ignore
  env.REACT_APP_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  // @ts-ignore
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  // @ts-ignore
  process.env.VITE_SUPABASE_ANON_KEY ||
  // @ts-ignore
  env.REACT_APP_SUPABASE_ANON_KEY || 
  '';

// Debugging (Masked keys for security)
const isConfigured = !!(supabaseUrl && supabaseAnonKey);
console.log(`[Supabase] Init: ${isConfigured ? 'Configured' : 'Missing Credentials'}`);

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Test the connection by trying to reach the Auth service
export const testConnection = async () => {
  if (!supabase) return { success: false, message: 'Client not initialized. Check .env' };
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, message: 'Connected to Supabase' };
  } catch (err: any) {
    console.error("Supabase Connection Test Failed:", err);
    return { success: false, message: err.message || 'Network Error' };
  }
};