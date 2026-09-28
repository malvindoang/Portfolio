import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect, useContext } from 'react'
import { createPortal } from 'react-dom'
import About from './About'
import { PageTransitionContext } from './PageTransitionContext'
import './Corners.css'

const GRID_GAP = 14

// ===== ENTRANCE DELAYS (MODEL A) =====
const HOME_DELAYS = {
  wordmark: 2,
  info: [2.4, 2.6],
  links: 2.8,
  social: 3.0,
  credits: 3.2,
}
const PROJECT_DELAYS = {
  wordmark: 0,
  info: [0.4, 0.6],
  links: 0.8,
  social: 1.0,
  credits: 1.2,
}

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

function Corners() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [exitingBtn, setExitingBtn] = useState(null) // 'back' | 'close' | null
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { routePath } = useContext(PageTransitionContext)
  const isHome = (routePath ?? location.pathname) === '/'

  const [bornDuringTransition] = useState(() =>
    document.body.classList.contains('pt-active')
  )

  const delays = isHome ? HOME_DELAYS : PROJECT_DELAYS

  // ===== MEASUREMENT: Hitung lebar max, set ke CSS Variable --grid-left =====
  useLayoutEffect(() => {
    const measure = () => {
      const w1 = wordmarkRef.current?.getBoundingClientRect().width || 0
      const w2 = navLinksRef.current?.getBoundingClientRect().width || 0
      const maxW = Math.max(w1, w2)
      const gridLeft = 40 + maxW + GRID_GAP
      document.documentElement.style.setProperty('--grid-left', `${gridLeft}px`)
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
  }, [])

  useEffect(() => {
    document.body.classList.toggle('about-open', aboutOpen)
    return () => {
      document.body.classList.remove('about-open')
    }
  }, [aboutOpen])

  // ===== AUTO-RESET exitingBtn =====
  // Mencegah state terjebak (stuck) setelah navigasi atau tutup about.
  // Setiap kali routePath atau aboutOpen berubah, exitingBtn di-reset ke null.
  // Ini menjamin tombol back/close selalu siap untuk interaksi berikutnya.
  useEffect(() => {
    setExitingBtn(null)
  }, [routePath, aboutOpen])

  useEffect(() => {
    const resetInlineAnim = () => {
      const sel = '.links, .social, .contact, .credits'
      document.querySelectorAll(sel).forEach(el => {
        if (el.style.animation === 'none') {
          el.style.animation = ''
        }
      })
    }

    window.addEventListener('pt-settled', resetInlineAnim)

    return () => {
      document.body.classList.remove('pt-corners-pre')
      window.removeEventListener('pt-settled', resetInlineAnim)
    }
  }, [])

  const handleWorksClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  const handleWordmarkClick = () => {
    setAboutOpen(false)
    navigate('/')
  }

  // ===== HANDLER DENGAN EXIT ANIMATION =====
  const handleBackClick = () => {
    if (exitingBtn) return // Cegah double click
    setExitingBtn('back')
    setTimeout(() => {
      navigate('/')
    }, 500) // Tunggu animasi 0.5s selesai
  }

  const handleCloseClick = () => {
    if (exitingBtn) return // Cegah double click
    setExitingBtn('close')
    setTimeout(() => {
      setAboutOpen(false)
      setExitingBtn(null)
    }, 500) // Tunggu animasi 0.5s selesai
  }

  const anim = (delay) =>
    bornDuringTransition ? { animation: 'none' } : { animationDelay: `${delay}s` }
  const btnAnim = bornDuringTransition ? { animation: 'none' } : undefined

  const up = !isHome || aboutOpen

  return createPortal(
    <>
      <header className="ui">
        <div ref={wordmarkRef} className={`wordmark-wrap ${up ? 'wordmark-wrap--top' : 'wordmark-wrap--bottom'}`}>
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

        <div className="info">
          <div className="info-left">
            <div className="contact" style={anim(delays.info[0])}>
              <span className="line">Front-end Developer</span>
              <span className="line">UI/UX Designer</span>
            </div>
            <div className="contact" style={anim(delays.info[1])}>
              <span className="line">Jakarta, Indonesia</span>
              <span className="line">
                <a href="mailto:malvin15.doang@gmail.com" className="email-link">
                  <strong>malvin15.doang@gmail.com</strong>
                </a>
              </span>
            </div>

            <nav ref={navLinksRef} className="links" style={anim(delays.links)}>
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

      <About isOpen={aboutOpen} />

      {/* TOMBOL CLOSE (ABOUT) */}
      {(aboutOpen && !exitingBtn) || exitingBtn === 'close' ? (
        <button
          type="button"
          className={`btn-back btn-back--close ${exitingBtn === 'close' ? 'is-exiting' : ''}`}
          onClick={handleCloseClick}
          aria-label="Close about"
          style={btnAnim}
          disabled={!!exitingBtn}
        >
          <IconBox type="close" />
        </button>
      ) : null}

      {/* TOMBOL BACK (PROJECT) */}
      {(!isHome && !aboutOpen && !exitingBtn) || exitingBtn === 'back' ? (
        <button
          type="button"
          className={`btn-back btn-back--back ${exitingBtn === 'back' ? 'is-exiting' : ''}`}
          onClick={handleBackClick}
          aria-label="Back to home"
          style={btnAnim}
          disabled={!!exitingBtn}
        >
          <IconBox type="back" />
        </button>
      ) : null}
    </>,
    document.body
  )
}

export default Corners