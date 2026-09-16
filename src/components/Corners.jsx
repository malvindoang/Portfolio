import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect, useContext } from 'react'
import { createPortal } from 'react-dom'
import About from './About'
import { PageTransitionContext } from './PageTransitionContext'
import { SECTIONS } from '../data/projects'
import './Corners.css'

const GRID_GAP = 14

const ICON_ROW_SPACER_COUNT = Math.max(SECTIONS.length - 1, 0)

const WORDMARK_DELAYS_HOME = [2, 2.2, 2.35]
const WORDMARK_DELAYS_PROJECT = [0, 0.2, 0.35]

const DIRECTIONAL_BASE_HOME = 2.5
const DIRECTIONAL_BASE_PROJECT = 0.3
const directionalDelay = (index, isHome) =>
  (isHome ? DIRECTIONAL_BASE_HOME : DIRECTIONAL_BASE_PROJECT) + index * 0.1

// ===== EXIT (mirror entrance, MURNI meluncur tanpa fade) =====
const EXIT_SLIDE_DURATION = 0.6
const EXIT_SLIDE_EASE = 'ease'
const EXIT_STAGGER = 0.18
const EXIT_DELAY_BR = 0
const EXIT_DELAY_TR = EXIT_STAGGER
const EXIT_DELAY_WORKS = EXIT_STAGGER * 2
const EXIT_DELAY_ABOUT = EXIT_STAGGER * 3
const EXIT_DELAY_WORDMARK = EXIT_STAGGER * 4

function CornerIconRows({ spacerCount, icon, onClick, ariaLabel, introOn, isHome, leaving }) {
  const boxClass =
    icon === 'back' ? 'cornerIconBox cornerIconBox--x' : 'cornerIconBox cornerIconBox--y'

  const rowStyle = leaving
    ? {
        animation: `cornerExitRight ${EXIT_SLIDE_DURATION}s ${EXIT_SLIDE_EASE} ${EXIT_DELAY_TR}s forwards`,
      }
    : introOn
    ? {
        animation: 'cornerFromRight 0.6s ease backwards',
        animationDelay: `${directionalDelay(spacerCount, isHome)}s`,
      }
    : undefined

  return (
    <>
      {Array.from({ length: spacerCount }).map((_, i) => (
        <div
          className="row"
          key={`spacer-${i}`}
          aria-hidden="true"
          style={{ visibility: 'hidden' }}
        >
          <span className="num">00</span>
          <span className="label">spacer</span>
        </div>
      ))}
      <div className="row" style={rowStyle}>
        <button
          type="button"
          className="cornerIconBtn"
          onClick={onClick}
          aria-label={ariaLabel}
        >
          <span className={boxClass} aria-hidden="true">
            {icon === 'back' ? (
              <span className="cornerIconBack" />
            ) : (
              <span className="cornerIconClose" />
            )}
          </span>
        </button>
      </div>
    </>
  )
}

/* Signature props: sectionNav DIHAPUS (Fase 1: section nav 01/02/03
   dibuang permanen, prop tidak lagi dibutuhkan). playIntro juga dihapus
   (tidak pernah dipakai di dalam komponen). */
function Corners({ onGridWidth, onBack }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [bodyLeft, setBodyLeft] = useState(220)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { routePath } = useContext(PageTransitionContext)
  const isHome = (routePath ?? location.pathname) === '/'

  const [leaving, setLeaving] = useState(false)
  const [entranceKey, setEntranceKey] = useState(() => 1)
  const prevRoutePathRef = useRef(routePath)

  const introOn = entranceKey > 0

  // Track route change untuk trigger entranceKey
  useEffect(() => {
    if (prevRoutePathRef.current !== routePath) {
      setEntranceKey((k) => k + 1)
      prevRoutePathRef.current = routePath
    }
  }, [routePath])

  useEffect(() => {
    const onExitStart = () => setLeaving(true)
    const onRevealStart = () => {
      setLeaving(false)
    }
    window.addEventListener('pt-exit-start', onExitStart)
    window.addEventListener('pt-reveal-start', onRevealStart)
    return () => {
      window.removeEventListener('pt-exit-start', onExitStart)
      window.removeEventListener('pt-reveal-start', onRevealStart)
    }
  }, [])

  const wordmarkDelays = isHome ? WORDMARK_DELAYS_HOME : WORDMARK_DELAYS_PROJECT

  const entranceLeft = (d) => ({
    animation: 'cornerFromLeft 0.6s ease backwards',
    animationDelay: `${d}s`,
  })
  const entranceRight = (d) => ({
    animation: 'cornerFromRight 0.6s ease backwards',
    animationDelay: `${d}s`,
  })
  const exitLeft = (d) => ({
    animation: `cornerExitLeft ${EXIT_SLIDE_DURATION}s ${EXIT_SLIDE_EASE} ${d}s forwards`,
  })
  const exitRight = (d) => ({
    animation: `cornerExitRight ${EXIT_SLIDE_DURATION}s ${EXIT_SLIDE_EASE} ${d}s forwards`,
  })
  const cornerStyle = (dir, entranceDelay, exitDelay) =>
    leaving
      ? dir === 'left'
        ? exitLeft(exitDelay)
        : exitRight(exitDelay)
      : introOn
      ? dir === 'left'
        ? entranceLeft(entranceDelay)
        : entranceRight(entranceDelay)
      : undefined

  useLayoutEffect(() => {
    const measure = () => {
      const w1 = wordmarkRef.current?.getBoundingClientRect().width || 0
      const w2 = navLinksRef.current?.getBoundingClientRect().width || 0
      const maxW = Math.max(w1, w2)
      if (onGridWidth) onGridWidth(maxW)
      setBodyLeft(40 + maxW + GRID_GAP)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wordmarkRef.current) ro.observe(wordmarkRef.current)
    if (navLinksRef.current) ro.observe(navLinksRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [onGridWidth])

  useEffect(() => {
    document.body.classList.toggle('about-open', aboutOpen)
    return () => {
      document.body.classList.remove('about-open')
    }
  }, [aboutOpen])

  const handleWorksClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  const handleWordmarkClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  const handleBackClick = () => {
    window.__SKIP_HOME_SCROLL_RESET__ = true
    if (onBack) onBack()
  }

  return createPortal(
    <>
      <div
        key={`wm-${entranceKey}`}
        ref={wordmarkRef}
        className={`navWordmark ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
        style={cornerStyle('left', 0, EXIT_DELAY_WORDMARK)}
      >
        <Link to="/" className="wordmarkLink" onClick={handleWordmarkClick}>
          <div className="wordmark">
            <div className="maskLine">
              <div
                className="maskInner"
                style={
                  introOn
                    ? { animationDelay: `${wordmarkDelays[0]}s` }
                    : { animation: 'none' }
                }
              >
                MALVIN
              </div>
            </div>
          </div>
        </Link>
        <div className="sub">
          <div className="maskLine">
            <div
              className="maskInner"
              style={
                introOn
                  ? { animationDelay: `${wordmarkDelays[1]}s` }
                  : { animation: 'none' }
              }
            >
              Front-end Developer
            </div>
          </div>
          <div className="maskLine">
            <div
              className="maskInner"
              style={
                introOn
                  ? { animationDelay: `${wordmarkDelays[2]}s` }
                  : { animation: 'none' }
              }
            >
              UI/UX Designer
            </div>
          </div>
        </div>
      </div>

      <div
        key={`nl-${entranceKey}`}
        ref={navLinksRef}
        className={`navLinks ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
      >
        <div
          className="row"
          style={cornerStyle('left', directionalDelay(0, isHome), EXIT_DELAY_ABOUT)}
        >
          <span className="label aboutTrigger" onClick={() => setAboutOpen((v) => !v)}>
            about
          </span>
          {aboutOpen && <span className="activeDash" />}
        </div>
        <div
          className="row"
          style={cornerStyle('left', directionalDelay(1, isHome), EXIT_DELAY_WORKS)}
        >
          <span className="label worksTrigger" onClick={handleWorksClick}>
            work(s)
          </span>
          {!aboutOpen && isHome && <span className="activeDash" />}
        </div>
      </div>

      {/* corner.tr: hanya close (about) atau back (project) atau kosong (home).
          Branch sectionNav DIHAPUS di Fase 1. */}
      <div className="corner tr">
        {aboutOpen ? (
          <CornerIconRows
            spacerCount={ICON_ROW_SPACER_COUNT}
            icon="close"
            ariaLabel="Close about"
            onClick={() => setAboutOpen(false)}
            introOn={introOn}
            isHome={isHome}
            leaving={leaving}
          />
        ) : onBack ? (
          <CornerIconRows
            spacerCount={ICON_ROW_SPACER_COUNT}
            icon="back"
            ariaLabel="Back to home"
            onClick={handleBackClick}
            introOn={introOn}
            isHome={isHome}
            leaving={leaving}
          />
        ) : null}
      </div>

      {/* corner.br: LiveClock DIHAPUS di Fase 1. Hanya "Jakarta, Indonesia"
          yang tersisa. */}
      {!aboutOpen && (
        <div
          key={`br-${entranceKey}`}
          className="corner br"
          style={cornerStyle('right', directionalDelay(3, isHome), EXIT_DELAY_BR)}
        >
          <div className="sub">
            Jakarta, Indonesia
          </div>
        </div>
      )}

      <About isOpen={aboutOpen} bodyLeft={bodyLeft} />
    </>,
    document.body
  )
}

export default Corners