import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import LiveClock from './LiveClock'
import About from './About'
import { SECTIONS } from '../data/projects'
import './Corners.css'

const GRID_GAP = 14

// Jumlah baris spacer tak-terlihat sebelum baris icon (back/close), supaya
// icon jatuh TEPAT di posisi baris terakhir sectionNav (mis. "03 — RESEARCH").
const ICON_ROW_SPACER_COUNT = Math.max(SECTIONS.length - 1, 0)

// Baris icon (back / close) — dibungkus spacer identik supaya mendarat di
// slot baris ke-N. Icon digambar via CSS (geometri persis vanholtz):
// - back  : bar 25px + kepala ±45°, loop HORIZONTAL saat hover
// - close : dua bar 25px bersilangan, loop VERTIKAL saat hover
function CornerIconRows({ spacerCount, icon, onClick, ariaLabel }) {
  const boxClass =
    icon === 'back' ? 'cornerIconBox cornerIconBox--x' : 'cornerIconBox cornerIconBox--y'

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
      <div className="row">
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

function Corners({ sectionNav, onGridWidth, onBack }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [bodyLeft, setBodyLeft] = useState(220)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
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

  const handleWorksClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  const handleWordmarkClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* Wordmark — bottom-left saat idle, pindah ke top-left saat about terbuka */}
      <div
        ref={wordmarkRef}
        className={`navWordmark ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
      >
        <Link to="/" className="wordmarkLink" onClick={handleWordmarkClick}>
          <div className="wordmark"><div>MALVIN</div></div>
        </Link>
        <div className="sub">Front-end Developer<br />UI/UX Designer</div>
      </div>

      {/* Nav about / work(s) — tanpa nomor urut */}
      <div
        ref={navLinksRef}
        className={`navLinks ${aboutOpen ? 'nav--open' : 'nav--closed'}`}
      >
        <div className="row">
          <span className="label aboutTrigger" onClick={() => setAboutOpen((v) => !v)}>
            about
          </span>
          {aboutOpen && <span className="activeDash" />}
        </div>
        <div className="row">
          <span className="label worksTrigger" onClick={handleWorksClick}>
            work(s)
          </span>
          {!aboutOpen && isHome && <span className="activeDash" />}
        </div>
      </div>

      {/* Corner kanan atas — SELALU dirender (about buka/tutup), supaya back &
          close menempati slot posisi yang SAMA PERSIS (baris "03"). */}
      <div className="corner tr">
        {aboutOpen ? (
          <CornerIconRows
            spacerCount={ICON_ROW_SPACER_COUNT}
            icon="close"
            ariaLabel="Close about"
            onClick={() => setAboutOpen(false)}
          />
        ) : sectionNav ? (
          sectionNav.map((s, i) => (
            <div className="row" key={s.label}>
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
            onClick={onBack}
          />
        ) : (
          <>
            <div className="row">
              <span className="num">03</span>
              <a href="https://www.linkedin.com/in/malvin-malvin-55974632b" target="_blank" rel="noreferrer">linkedin</a>
            </div>
            <div className="row">
              <span className="num">04</span>
              <a href="https://github.com/malvindoang" target="_blank" rel="noreferrer">github</a>
            </div>
            <div className="row">
              <span className="num">05</span>
              <a href="mailto:malvin15.doang@gmail.com">email</a>
            </div>
          </>
        )}
      </div>

      {/* Kontak (Jakarta + jam) — hilang instan saat about terbuka */}
      {!aboutOpen && (
        <div className="corner br">
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