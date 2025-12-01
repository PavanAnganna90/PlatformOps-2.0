import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We cast process to any to avoid TS errors in the config file context
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for compatibility with existing code
      // We explicitly define process.env so accessing properties on it works in the browser
      'process.env': JSON.stringify(env)
    }
  };
});