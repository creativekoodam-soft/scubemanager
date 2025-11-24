import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Maps process.env.API_KEY to the actual environment variable for the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      host: '0.0.0.0',
    }
  }
})