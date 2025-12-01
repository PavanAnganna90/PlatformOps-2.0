import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safely expose environment variables to the client
      // We only expose standard React/Supabase env vars to prevent leaking secrets
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        REACT_APP_SUPABASE_URL: JSON.stringify(env.REACT_APP_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL),
        REACT_APP_SUPABASE_ANON_KEY: JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
        API_KEY: JSON.stringify(env.API_KEY || env.VITE_API_KEY)
      }
    }
  };
});