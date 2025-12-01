import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the existing code
      // We must stringify the values to ensure they are inserted as strings in the code
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY,
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
        ...env
      })
    }
  };
});