import { defineConfig } from 'vite'

export default defineConfig({
  // Redirigir todas las rutas al index.html para que funcione el enrutamiento SPA
  // (Esto permite que /admin funcione sin 404)
  appType: 'spa',
})
