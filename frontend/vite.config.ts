import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5173 LANG (Day 99 hardening). Ang backend ay tumatanggap lang ng CLIENT_URL=http://localhost:5173 (CORS, CSRF, at ang origin ng passkey).
  // Dati, kapag okupado ang 5173 (hal. ibang project), tahimik na lumilipat ang Vite sa 5174 — at bawat request ay tinatanggihan
  // nang walang malinaw na dahilan. Ngayon: PUMAPALYA agad, at sinasabi kung bakit
  server: { port: 5173, strictPort: true },
})
