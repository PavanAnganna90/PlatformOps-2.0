import { createClient } from '@supabase/supabase-js';

// Helper to get env vars safely across Vite/Vercel/Node environments
const getEnv = (key: string) => {
  // 1. Try Import Meta (Vite standard)
  try {
    const meta = import.meta as any;
    if (meta && meta.env) {
      if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
      if (meta.env[key]) return meta.env[key];
    }
  } catch (e) {
    // Ignore access errors
  }

  // 2. Try process.env (Polyfilled by Vite or standard Node)
  try {
    // We rely on the replacement defined in vite.config.ts
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[`REACT_APP_${key}`] || 
             // @ts-ignore
             process.env[`NEXT_PUBLIC_${key}`] || 
             // @ts-ignore
             process.env[key];
    }
  } catch (e) {
    // Ignore ReferenceErrors
  }
  
  return '';
};

// HARDCODED FALLBACKS (Only used if Env Vars are completely missing)
const DEFAULT_URL = 'https://xwowcmfgoweowueqfbrb.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3djbWZnb3dlb3d1ZXFmYnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTYwODYsImV4cCI6MjA4MDE5MjA4Nn0.RTPPHU8VDZrIpB2iCQtsvZ_T3j3nULbIvnibghJvFVU';

const supabaseUrl = getEnv('SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY') || DEFAULT_KEY;

// Debugging (Remove in strict production if needed, but helpful for Vercel debugging)
const isConfigured = !!(getEnv('SUPABASE_URL') && (getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY')));
console.log(`[Supabase] Init: ${isConfigured ? 'Using Env Vars' : 'Using Defaults'}`);

export const supabase = (supabaseUrl && supabaseAnonKey) 
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