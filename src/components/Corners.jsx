import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect, useContext } from 'react'
import { createPortal } from 'react-dom'
import About from './About'
import { PageTransitionContext } from './PageTransitionContext'
import './Corners.css'

const GRID_GAP = 14

// ===== DELAYS ENTRANCE (persis vanholtz dari Script 4) =====
const HOME_DELAYS = {
  wordmark: 2,
  info: [2.4, 2.6],
  links: 2.8,
  social: 3.0,
  credits: 3.2,
}
const PROJECT_DELAYS = {
  wordmark: 0,
  info: [0.4, 0.8],
  links: 0.4,
  social: 1.0,
  credits: 1.2,
}

// ===== SOCIAL LINKS (tanpa nomor, urutan sesuai keputusan) =====
const SOCIAL_LINKS = [
  { label: 'instagram', href: 'https://www.instagram.com/malvin.15' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/malvin-malvin-55974632b' },
  { label: 'github', href: 'https://github.com/malvindoang' },
]

function IconBox({ type }) {
  return (
    <span className={type === 'back' ? 'btn-box btn-box--back' : 'btn-box btn-box--close'}>
      <span className={type === 'back' ? 'icon-back' : 'icon-close'} />
    </span>
  )
}

function Corners({ onGridWidth, onBack }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { routePath } = useContext(PageTransitionContext)
  const isHome = (routePath ?? location.pathname) === '/'

  // ===== ENTRANCE KEY: replay animasi setiap route berubah =====
  const [entranceKey, setEntranceKey] = useState(() => 1)
  const prevRoutePathRef = useRef(routePath)

  useEffect(() => {
    if (prevRoutePathRef.current !== routePath) {
      setEntranceKey((k) => k + 1)
      prevRoutePathRef.current = routePath
    }
  }, [routePath])

  const delays = isHome ? HOME_DELAYS : PROJECT_DELAYS
  const play = entranceKey > 0

  // ===== STATE NAIK: hanya wordmark yang pakai class top/bottom.
  // Links naik via ul (CSS, body class), nav tetap di aliran flex. =====
  const up = !isHome || aboutOpen

  // ===== MEASUREMENT untuk onGridWidth =====
  useLayoutEffect(() => {
    const measure = () => {
      const w1 = wordmarkRef.current?.getBoundingClientRect().width || 0
      const w2 = navLinksRef.current?.getBoundingClientRect().width || 0
      const maxW = Math.max(w1, w2)
      if (onGridWidth) onGridWidth(maxW)
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

  const anim = (delay) =>
    play ? { animationDelay: `${delay}s` } : { animation: 'none' }

  return createPortal(
    <>
      <header className="ui">
        {/* ===== WORDMARK: MALVIN satu baris, fixed, KNOB px ===== */}
        <div
          key={`wm-${entranceKey}`}
          ref={wordmarkRef}
          className={`wordmark-wrap ${up ? 'wordmark-wrap--top' : 'wordmark-wrap--bottom'}`}
        >
          <Link to="/" className="wordmark-link" onClick={handleWordmarkClick}>
            <div className="wordmark">
              <span className="slideUp">
                <span className="wordmark-text" style={anim(delays.wordmark)}>
                  MALVIN
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* ===== INFO: SATU container footer.
            info-left = 3 kolom flex dengan gap 3vw SERAGAM:
            kontak-1 · kontak-2 · links(about/works).
            Saat about open: kontak + kanan fade, links tetap & ul naik. ===== */}
        <div key={`info-${entranceKey}`} className="info">
          <div className="info-left">
            <div className="contact" style={anim(delays.info[0])}>
              <span className="line">Front-end Developer</span>
              <span className="line">UI/UX Designer</span>
            </div>
            <div className="contact" style={anim(delays.info[1])}>
              <span className="line">Jakarta, Indonesia</span>
              <span className="line">
                <strong>
                  <a href="mailto:malvin15.doang@gmail.com" className="email-link">
                    malvin15.doang@gmail.com
                  </a>
                </strong>
              </span>
            </div>

            {/* Kolom ke-3: about/works — di dalam flex flow supaya gap 3vw
                sama di semua viewport; rise via ul (CSS body class) */}
            <nav
              key={`links-${entranceKey}`}
              ref={navLinksRef}
              className="links"
              style={anim(delays.links)}
            >
              <ul>
                <li className="about-li">
                  <button type="button" className="link" onClick={() => setAboutOpen((v) => !v)}>
                    <strong>about</strong>
                  </button>
                  <span className="aboutDash" aria-hidden="true" />
                </li>
                <li className="works-li">
                  <button type="button" className="link" onClick={handleWorksClick}>
                    <strong>works</strong>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <div className="info-right">
            <nav className="social" style={anim(delays.social)}>
              <ul>
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer">
                      <strong>{s.label}</strong>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="credits" style={anim(delays.credits)}>
              <strong>design</strong>
            </div>
          </div>
        </div>
      </header>

      {/* ===== ABOUT OVERLAY ===== */}
      <About isOpen={aboutOpen} />

      {/* ===== CLOSE (×) saat about open ===== */}
      {aboutOpen && (
        <button
          type="button"
          className="btn-back btn-back--close"
          onClick={() => setAboutOpen(false)}
          aria-label="Close about"
        >
          <IconBox type="close" />
        </button>
      )}

      {/* ===== BACK (←) saat project & about tutup ===== */}
      {!isHome && !aboutOpen && onBack && (
        <button
          type="button"
          className="btn-back btn-back--back"
          onClick={handleBackClick}
          aria-label="Back to home"
        >
          <IconBox type="back" />
        </button>
      )}
    </>,
    document.body
  )
}

export default Corners