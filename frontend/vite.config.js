import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Redirigir todas las rutas al index.html para que funcione el enrutamiento SPA
  // (Esto permite que /admin funcione sin 404)
  appType: 'spa',
  build: {
    rollupOptions: {
      output: {
        // Code splitting: separa vendor, mapa y charts en chunks independientes
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'map';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
        }
      }
    },
    sourcemap: false,
    // Minificación con terser (más agresiva que esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Eliminar console.log en producción
        drop_debugger: true,  // Eliminar debugger en producción
      }
    }
  }
})
