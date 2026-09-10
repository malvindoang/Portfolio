import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import './motion/motion.css'

// CATATAN: StrictMode sengaja TIDAK dipakai.
// StrictMode di React 18+ menjalankan setiap useLayoutEffect 2x di dev mode
// (mount → unmount → remount). Ini menyebabkan masalah pada pola yang
// menyimpan state antar mount (seperti lastHomeScrollY untuk restore posisi
// scroll saat kembali dari project via tombol back).
// Production build TIDAK pernah menjalankan StrictMode, jadi mematikan ini
// di dev = membuat perilaku dev identik dengan production.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)