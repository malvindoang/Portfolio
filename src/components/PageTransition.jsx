import { cloneElement, useRef, useState, useLayoutEffect, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { PageTransitionContext } from './PageTransitionContext'
import Corners from './Corners'

gsap.registerPlugin(CustomEase)

const EASE_NAME = 'ptEase'
if (!CustomEase.get(EASE_NAME)) {
  CustomEase.create(EASE_NAME, 'M0,0 C0.45,0 0.2,1 1,1')
}

const COLOR_HOME = '#E34234'
const COLOR_PROJECT = '#F2F2F2'
const COVER_DURATION = 0.35
const HOLD_COVER = 0.12

const EXIT_DURATION = 1.6

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
    const fromProject = displayLoc.pathname !== '/'
    const targetColor = toProject ? COLOR_PROJECT : COLOR_HOME
    const curtain = curtainRef.current
    const viewport = viewportRef.current

    document.body.classList.add('pt-active', 'overflowHidden')
    gsap.set(curtain, { backgroundColor: targetColor, opacity: 0 })
    gsap.set(viewport, { opacity: 1 })

    const finish = () => {
      gsap.set(viewport, { clearProps: 'opacity' })
      gsap.set(curtain, { opacity: 0 })
      document.body.classList.remove(
        'pt-active', 'overflowHidden', 'pt-exit-active',
        'pt-corners-hold-top', 'pt-corners-hold-down',
        'pt-corners-dark', 'pt-corners-light', 'pt-bg-project'
      )
      runningRef.current = false
      if (safetyRef.current) clearTimeout(safetyRef.current)
      window.dispatchEvent(new Event('pt-settled'))
    }

    const tl = gsap.timeline({ onComplete: finish })
    tlRef.current = tl

    const coverStart = fromProject ? EXIT_DURATION : 0

    if (fromProject) {
      tl.call(
        () => {
          document.body.classList.add('pt-exit-active')
        },
        null,
        0
      )
      tl.to({}, { duration: EXIT_DURATION }, 0)
    }

    tl.call(
      () => {
        document.body.classList.toggle('pt-corners-dark', toProject)
        document.body.classList.toggle('pt-corners-light', !toProject)
      },
      null,
      coverStart
    )
    tl.to(curtain, { opacity: 1, duration: COVER_DURATION, ease: EASE_NAME }, coverStart)
    tl.to(viewport, { opacity: 0, duration: COVER_DURATION, ease: EASE_NAME }, coverStart)
    tl.set(curtain, { opacity: 1 }, coverStart + COVER_DURATION)
    tl.set(viewport, { opacity: 0 }, coverStart + COVER_DURATION)

    tl.call(
      () => {
        if (!fromProject && toProject) {
          document.body.classList.add('pt-corners-hold-down')
        } else if (fromProject && !toProject) {
          document.body.classList.add('pt-corners-hold-top')
        }
        window.__PT_HOME_ENTRANCE_PENDING__ = !toProject
        window.scrollTo({ top: 0, behavior: 'instant' })
        setDisplayLoc(location)
        document.body.classList.toggle('pt-bg-project', toProject)
      },
      null,
      coverStart + COVER_DURATION + 0.02
    )

    tl.call(
      () => {
        document.body.classList.remove('pt-exit-active')
        document.body.classList.remove(
          'pt-corners-hold-top', 'pt-corners-hold-down'
        )
        window.dispatchEvent(new Event('pt-reveal-start'))
      },
      null,
      coverStart + COVER_DURATION + HOLD_COVER
    )
    tl.set(viewport, { opacity: 1 }, coverStart + COVER_DURATION + HOLD_COVER)
    tl.set(curtain, { opacity: 0 }, coverStart + COVER_DURATION + HOLD_COVER)

    safetyRef.current = setTimeout(
      finish,
      (coverStart + COVER_DURATION + HOLD_COVER + 1) * 1000
    )
  }, [location, displayLoc])

  return (
    <PageTransitionContext.Provider value={{ isActive: true, routePath: displayLoc.pathname }}>
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
      <div ref={viewportRef} className="ptViewport">
        {cloneElement(children, { location: displayLoc })}
      </div>

      <Corners />
    </PageTransitionContext.Provider>
  )
}

export default PageTransition