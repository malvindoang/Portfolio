import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import LiveClock from './LiveClock'
import About from './About'
import './Corners.css'

const GRID_GAP = 14

function Corners({ sectionNav, onGridWidth }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [bodyLeft, setBodyLeft] = useState(220)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  // Ukur elemen terlebar (wordmark / navLinks) supaya section label (Home)
  // DAN body About sama-sama menempel tepat di ujung grid kiri + gap kecil
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

      {/* Kontak (halaman lain) / section nav (Home) & status — hilang instan saat about terbuka */}
      {!aboutOpen && (
        <>
          <div className="corner tr">
            {sectionNav ? (
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

          <div className="corner br">
            <div className="sub">
              Jakarta, Indonesia<br />
              <LiveClock />
            </div>
          </div>
        </>
      )}

      <About isOpen={aboutOpen} onClose={() => setAboutOpen(false)} bodyLeft={bodyLeft} />
    </>
  )
}

export default Corners