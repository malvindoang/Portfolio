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
const HOLD_COVER = 0.12 // jeda curtain menutup penuh sebelum reveal
const REVEAL_DURATION = 0.5

function PageTransition({ children }) {
  const location = useLocation()
  const [displayLoc, setDisplayLoc] = useState(location)

  const curtainRef = useRef(null)
  const runningRef = useRef(false)
  const tlRef = useRef(null)
  const safetyRef = useRef(null)

  // Kill hanya saat unmount benar-benar
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

    document.body.classList.add('pt-active', 'overflowHidden')
    gsap.set(curtain, { backgroundColor: targetColor, opacity: 0 })

    const finish = () => {
      document.body.classList.remove('pt-active', 'overflowHidden')
      runningRef.current = false
      if (safetyRef.current) clearTimeout(safetyRef.current)
      window.dispatchEvent(new Event('pt-settled'))
    }

    const tl = gsap.timeline({ onComplete: finish })
    tlRef.current = tl

    // 1) Curtain fade-in menutupi halaman lama
    tl.to(curtain, { opacity: 1, duration: COVER_DURATION, ease: EASE_NAME }, 0)

    // 2) PASTIKAN curtain opacity benar-benar 1 (tidak mengandalkan frame
    //    terakhir tween) sebelum apa pun di-swap di belakangnya.
    tl.set(curtain, { opacity: 1 }, COVER_DURATION)

    // 3) Di balik curtain yang sudah penuh: swap route + snap warna body
    //    & corners SEKETIKA (tanpa transition di CSS → tidak ada sisa).
    tl.call(
      () => {
        window.__PT_HOME_ENTRANCE_PENDING__ = !toProject
        window.scrollTo(0, 0)
        setDisplayLoc(location)
        document.body.classList.toggle('pt-bg-project', toProject)
        document.body.classList.toggle('pt-corners-dark', toProject)
        window.dispatchEvent(new Event('pt-bg-set'))
      },
      null,
      COVER_DURATION + 0.02
    )

    // 4) Tahan sebentar (curtain penuh), lalu buka = reveal halaman baru
    tl.call(
      () => {
        window.dispatchEvent(new Event('pt-reveal-start'))
      },
      null,
      COVER_DURATION + HOLD_COVER
    )
    tl.to(
      curtain,
      { opacity: 0, duration: REVEAL_DURATION, ease: EASE_NAME },
      COVER_DURATION + HOLD_COVER
    )

    // Safety: tidak boleh macet permanen
    safetyRef.current = setTimeout(
      finish,
      (COVER_DURATION + HOLD_COVER + REVEAL_DURATION + 1) * 1000
    )

    // PENTING: tidak ada cleanup yang meng-kill timeline ini saat deps berubah.
  }, [location, displayLoc])

  return (
    <PageTransitionContext.Provider value={{ isActive: true, routePath: displayLoc.pathname }}>
      {/* Curtain: di atas corners (z 50) supaya pergantian chrome tertutup */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div className="ptViewport">
        {cloneElement(children, { location: displayLoc })}
      </div>
    </PageTransitionContext.Provider>
  )
}

export default PageTransition