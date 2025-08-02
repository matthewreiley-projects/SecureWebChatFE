import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true, // Listen on 0.0.0.0 (not just localhost)
    port: process.env.PORT || 4173, // Railway sets PORT env variable
    allowedHosts: [
      'healthcheck.railway.app',
      'https://web-chat-frontend-only-production.up.railway.app' // <- ADD YOUR DOMAIN HERE
    ]
  }
  // Uncomment below if you're using HTTPS certs locally
  // server: {
  //   https: {
  //     key: fs.readFileSync('./certs/server.key'),
  //     cert: fs.readFileSync('./certs/server.cert')
  //   }
  // }
})
