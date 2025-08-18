import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('Vite Config - Environment Variables Loaded:', {
    mode,
    cwd: process.cwd(),
    envKeys: Object.keys(env).filter(key => key.startsWith('VITE_'))
  })
  
  return {
    plugins: [react(), tailwindcss()],
    // Ensure environment variables are loaded
    envDir: '.',
    // Load all environment variables
    envPrefix: 'VITE_',
    // Define global constants
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
