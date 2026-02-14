import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Add your Cloudflare tunnel hostname here:
    allowedHosts: ['hyui.marcusdavidalo.xyz']
  },
})
