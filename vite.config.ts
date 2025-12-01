import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safely expose environment variables to the client.
      // We manually map specific keys to ensure Vercel system vars are picked up 
      // even if they don't have the VITE_ prefix.
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        
        // Supabase URL
        REACT_APP_SUPABASE_URL: JSON.stringify(env.REACT_APP_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL),
        
        // Supabase Key
        REACT_APP_SUPABASE_ANON_KEY: JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY),
        
        // Gemini API Key
        API_KEY: JSON.stringify(env.API_KEY || env.VITE_API_KEY)
      }
    }
  };
});