import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import LiveClock from './LiveClock'
import About from './About'
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

const CORNERS_INTRO_MS_HOME = 3500
const CORNERS_INTRO_MS_PROJECT = 1300

function CornerIconRows({ spacerCount, icon, onClick, ariaLabel, cornersIntro, isHome }) {
  const boxClass =
    icon === 'back' ? 'cornerIconBox cornerIconBox--x' : 'cornerIconBox cornerIconBox--y'

  const rowStyle = cornersIntro
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

function Corners({ sectionNav, onGridWidth, onBack, playIntro: playIntroProp }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [bodyLeft, setBodyLeft] = useState(220)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  const [playIntroSelf] = useState(() => !window.__INTRO_DONE__)
  const playIntro = typeof playIntroProp === 'boolean' ? playIntroProp : playIntroSelf

  useEffect(() => {
    if (!playIntro) return undefined
    const t = setTimeout(() => {
      window.__INTRO_DONE__ = true
    }, 0)
    return () => clearTimeout(t)
  }, [playIntro])

  const [cornersIntro, setCornersIntro] = useState(true)
  useEffect(() => {
    const ms = isHome ? CORNERS_INTRO_MS_HOME : CORNERS_INTRO_MS_PROJECT
    const t = setTimeout(() => setCornersIntro(false), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const introOn = playIntro && cornersIntro

  const wordmarkDelays = isHome ? WORDMARK_DELAYS_HOME : WORDMARK_DELAYS_PROJECT

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

  // Wordmark MALVIN — TIDAK set flag → Home reset scroll ke atas.
  const handleWordmarkClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  // Tombol back (←) di pojok kanan atas halaman project — set flag
  // SEBELUM navigate. Home akan: (1) tidak memasang scroll-lock
  // overflow:hidden (penyebab clamp ke 0), dan (2) restore posisi
  // scroll home terakhir — persis seperti browser back.
  const handleBackClick = () => {
    window.__SKIP_HOME_SCROLL_RESET__ = true
    if (onBack) onBack()
  }

  return (
    <>
      <div
        ref={wordmarkRef}
        className={`navWordmark ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
      >
        <Link to="/" className="wordmarkLink" onClick={handleWordmarkClick}>
          <div className="wordmark">
            <div className="maskLine">
              <div
                className="maskInner"
                style={
                  playIntro
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
                playIntro
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
                playIntro
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
        ref={navLinksRef}
        className={`navLinks ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
      >
        <div
          className="row"
          style={
            playIntro
              ? {
                  animation: 'cornerFromLeft 0.6s ease backwards',
                  animationDelay: `${directionalDelay(0, isHome)}s`,
                }
              : undefined
          }
        >
          <span className="label aboutTrigger" onClick={() => setAboutOpen((v) => !v)}>
            about
          </span>
          {aboutOpen && <span className="activeDash" />}
        </div>
        <div
          className="row"
          style={
            playIntro
              ? {
                  animation: 'cornerFromLeft 0.6s ease backwards',
                  animationDelay: `${directionalDelay(1, isHome)}s`,
                }
              : undefined
          }
        >
          <span className="label worksTrigger" onClick={handleWorksClick}>
            work(s)
          </span>
          {!aboutOpen && isHome && <span className="activeDash" />}
        </div>
      </div>

      <div className="corner tr">
        {aboutOpen ? (
          <CornerIconRows
            spacerCount={ICON_ROW_SPACER_COUNT}
            icon="close"
            ariaLabel="Close about"
            onClick={() => setAboutOpen(false)}
            cornersIntro={introOn}
            isHome={isHome}
          />
        ) : sectionNav ? (
          sectionNav.map((s, i) => (
            <div
              className="row"
              key={s.label}
              style={
                introOn
                  ? {
                      animation: 'cornerFromRight 0.6s ease backwards',
                      animationDelay: `${directionalDelay(i, isHome)}s`,
                    }
                  : undefined
              }
            >
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span
                className={`label sectionNavItem${
                  s.active ? ' sectionNavItem--active' : ' sectionNavItem--disabled'
                }`}
                onClick={s.active ? s.onClick : undefined}
              >
                {s.label}
              </span>
            </div>
          ))
        ) : onBack ? (
          <CornerIconRows
            spacerCount={ICON_ROW_SPACER_COUNT}
            icon="back"
            ariaLabel="Back to home"
            onClick={handleBackClick}
            cornersIntro={introOn}
            isHome={isHome}
          />
        ) : null}
      </div>

      {!aboutOpen && (
        <div
          className="corner br"
          style={
            introOn
              ? {
                  animation: 'cornerFromRight 0.6s ease backwards',
                  animationDelay: `${directionalDelay(3, isHome)}s`,
                }
              : undefined
          }
        >
          <div className="sub">
            Jakarta, Indonesia<br />
            <LiveClock />
          </div>
        </div>
      )}

      <About isOpen={aboutOpen} bodyLeft={bodyLeft} />
    </>
  )
}

export default Corners