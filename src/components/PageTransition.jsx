import { cloneElement, useRef, useState, useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { PageTransitionContext } from './PageTransitionContext'

gsap.registerPlugin(CustomEase)

const EASE_NAME = 'ptEase'
if (!CustomEase.get(EASE_NAME)) {
  CustomEase.create(EASE_NAME, 'M0,0 C0.45,0 0.2,1 1,1')
}

const COLOR_HOME = '#E34234'
const COLOR_PROJECT = '#F2F2F2'
const COVER_DURATION = 0.35
const HOLD_COVER = 0.12
const TR_OUT = 0.12

function PageTransition({ children }) {
  const location = useLocation()
  const [displayLoc, setDisplayLoc] = useState(location)

  const viewportRef = useRef(null)
  const curtainRef = useRef(null)
  const runningRef = useRef(false)
  const tlRef = useRef(null)
  const safetyRef = useRef(null)

  useEffect(() => {
    return () => {
      tlRef.current?.kill()
      if (safetyRef.current) clearTimeout(safetyRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (location.key === displayLoc.key) return
    if (runningRef.current) return
    runningRef.current = true

    const toProject = location.pathname !== '/'
    const targetColor = toProject ? COLOR_PROJECT : COLOR_HOME
    const curtain = curtainRef.current
    const viewport = viewportRef.current

    document.body.classList.add('pt-active', 'overflowHidden')
    gsap.set(curtain, { backgroundColor: targetColor, opacity: 0 })
    gsap.set(viewport, { opacity: 1 })

    const finish = () => {
      gsap.set(viewport, { clearProps: 'opacity' })
      gsap.set(curtain, { opacity: 0 })
      document.body.classList.remove('pt-active', 'overflowHidden', 'pt-tr-hidden')
      runningRef.current = false
      if (safetyRef.current) clearTimeout(safetyRef.current)
      window.dispatchEvent(new Event('pt-settled'))
    }

    const tl = gsap.timeline({ onComplete: finish })
    tlRef.current = tl

    // ===== COVER: konten lama meluruh DI ATAS warna baru yang masuk =====
    tl.call(
      () => {
        document.body.classList.toggle('pt-corners-dark', toProject)
        window.dispatchEvent(new Event('pt-cover-start'))
      },
      null,
      0
    )
    tl.to(curtain, { opacity: 1, duration: COVER_DURATION, ease: EASE_NAME }, 0)
    tl.to(viewport, { opacity: 0, duration: COVER_DURATION, ease: EASE_NAME }, 0)
    tl.set(curtain, { opacity: 1 }, COVER_DURATION)
    tl.set(viewport, { opacity: 0 }, COVER_DURATION)

    // Fade-out grup chrome yang akan berganti konten
    tl.call(
      () => {
        document.body.classList.add('pt-tr-hidden')
      },
      null,
      COVER_DURATION - TR_OUT
    )

    // ===== SWAP: mount konten baru di balik beat warna (sudah opacity 0) =====
    tl.call(
      () => {
        window.__PT_HOME_ENTRANCE_PENDING__ = !toProject
        window.scrollTo(0, 0)
        setDisplayLoc(location)
        document.body.classList.toggle('pt-bg-project', toProject)
        window.dispatchEvent(new Event('pt-bg-set'))
      },
      null,
      COVER_DURATION + 0.02
    )

    // ===== REVEAL: CUT, bukan fade =====
    // Konten baru LANGSUNG penuh (opacity 1) tepat saat beat warna selesai,
    // sehingga "konten sudah ada saat warna putih muncul" — tanpa fade-in.
    tl.call(
      () => {
        document.body.classList.remove('pt-tr-hidden')
        window.dispatchEvent(new Event('pt-reveal-start'))
      },
      null,
      COVER_DURATION + HOLD_COVER
    )
    tl.set(viewport, { opacity: 1 }, COVER_DURATION + HOLD_COVER)
    tl.set(curtain, { opacity: 0 }, COVER_DURATION + HOLD_COVER)

    safetyRef.current = setTimeout(
      finish,
      (COVER_DURATION + HOLD_COVER + 1) * 1000
    )
  }, [location, displayLoc])

  return (
    <PageTransitionContext.Provider value={{ isActive: true, routePath: displayLoc.pathname }}>
      {/* Curtain = lapis warna, DI BAWAH konten (z 5) */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Viewport = konten, DI ATAS curtain (z 10), DI BAWAH corners (z 60) */}
      <div ref={viewportRef} className="ptViewport">
        {cloneElement(children, { location: displayLoc })}
      </div>
    </PageTransitionContext.Provider>
  )
}

export default PageTransition