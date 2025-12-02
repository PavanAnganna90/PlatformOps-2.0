import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Define 'process.env' as a global object to prevent "process is not defined" errors in browser
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        REACT_APP_SUPABASE_URL: JSON.stringify(env.REACT_APP_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL),
        REACT_APP_SUPABASE_ANON_KEY: JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY),
        API_KEY: JSON.stringify(env.API_KEY || env.VITE_API_KEY)
      }
    }
  };
});