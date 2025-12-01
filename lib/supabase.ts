import { createClient } from '@supabase/supabase-js';

// Helper to get env vars regardless of the build tool (Vite, CRA, Next.js)
const getEnv = (key: string) => {
  // 1. Try Import Meta (Vite standard)
  // Cast import.meta to any to avoid TS errors about 'env' missing on ImportMeta
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    // Check for VITE_ prefixed variables (standard Vite)
    if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
    // Check for direct access (if mapped in vite.config.ts)
    if (meta.env[key]) return meta.env[key];
  }

  // 2. Try process.env (Polyfilled by Vite or standard Node)
  // We access process.env directly without a 'typeof process' check because
  // Vite replaces 'process.env' with a static object in the bundle.
  try {
    // @ts-ignore
    return process.env[`REACT_APP_${key}`] || 
           // @ts-ignore
           process.env[`NEXT_PUBLIC_${key}`] || 
           // @ts-ignore
           process.env[key];
  } catch (e) {
    // Ignore ReferenceErrors if process is not defined
    return '';
  }
};

// HARDCODED FALLBACKS (For immediate Plug & Play)
// In a real production app, you would rely strictly on getEnv
const DEFAULT_URL = 'https://xwowcmfgoweowueqfbrb.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3djbWZnb3dlb3d1ZXFmYnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTYwODYsImV4cCI6MjA4MDE5MjA4Nn0.RTPPHU8VDZrIpB2iCQtsvZ_T3j3nULbIvnibghJvFVU';

const supabaseUrl = getEnv('SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY') || DEFAULT_KEY;

// Debugging log (visible in browser console)
console.log(`Supabase Config: URL=${supabaseUrl ? 'Set' : 'Missing'}, Key=${supabaseAnonKey ? 'Set' : 'Missing'}`);

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Test the connection by trying to reach the Auth service
export const testConnection = async () => {
  if (!supabase) return { success: false, message: 'Client not initialized. Check .env' };
  try {
    // Determine if we can reach the server
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, message: 'Connected to Supabase' };
  } catch (err: any) {
    console.error("Supabase Connection Test Failed:", err);
    return { success: false, message: err.message || 'Network Error' };
  }
};