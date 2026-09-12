import { createContext } from 'react'

// isActive: apakah instance halaman ini yang aktif (default true untuk hard-reload).
// routePath: pathname yang SEDANG dirender oleh PageTransition (bukan pathname
// router yang bisa berubah lebih dulu). Dipakai Corners supaya chrome tidak
// switch terlalu awal di tengah transisi.
export const PageTransitionContext = createContext({ isActive: true, routePath: undefined })