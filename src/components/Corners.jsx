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
  const [exitingBtn, setExitingBtn] = useState(null)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const { routePath } = useContext(PageTransitionContext)
  const currentPath = routePath ?? location.pathname
  
  // Regex ketat untuk menentukan isHome.
  const isValidProjectUrl = /^\/project\/[^/]+$/.test(currentPath)
  const isHome = !isValidProjectUrl

  const delays = isHome ? HOME_DELAYS : PROJECT_DELAYS

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

  // ===== AUTO-RESET exitingBtn + aboutOpen =====
  useEffect(() => {
    setExitingBtn(null)
    setAboutOpen(false)
  }, [routePath])

  const handleWorksClick = () => {
    setAboutOpen(false)
    if (!isHome) {
      navigate('/')
    }
  }

  const handleWordmarkClick = (e) => {
    setAboutOpen(false)
    if (isHome) {
      e.preventDefault()
    }
  }

  const handleBackClick = () => {
    if (exitingBtn) return
    setExitingBtn('back')
    setTimeout(() => {
      navigate('/')
    }, 500)
  }

  const handleCloseClick = () => {
    if (exitingBtn) return
    setExitingBtn('close')
    setTimeout(() => {
      setAboutOpen(false)
      setExitingBtn(null)
    }, 500)
  }

  const up = !isHome || aboutOpen

  return createPortal(
    <>
      <header className="ui">
        <div ref={wordmarkRef} className={`wordmark-wrap ${up ? 'wordmark-wrap--top' : 'wordmark-wrap--bottom'}`}>
          <Link to="/" className="wordmark-link" onClick={handleWordmarkClick}>
            <div className="wordmark">
              <span className="slideUp">
                <span className="wordmark-text" style={{ animationDelay: `${delays.wordmark}s` }}>
                  MALVIN
                </span>
              </span>
            </div>
          </Link>
        </div>

        <div className="info">
          <div className="info-left">
            <div className="contact" style={{ animationDelay: `${delays.info[0]}s` }}>
              <span className="line">Front-end Developer</span>
              <span className="line">UI/UX Designer</span>
            </div>
            <div className="contact" style={{ animationDelay: `${delays.info[1]}s` }}>
              <span className="line">Jakarta, Indonesia</span>
              <span className="line">
                <a href="mailto:malvin15.doang@gmail.com" className="email-link">
                  <strong>malvin15.doang@gmail.com</strong>
                </a>
              </span>
            </div>

            <nav ref={navLinksRef} className="links" style={{ animationDelay: `${delays.links}s` }}>
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
            <nav className="social" style={{ animationDelay: `${delays.social}s` }}>
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
            <div className="credits" style={{ animationDelay: `${delays.credits}s` }}>
              <strong>design</strong>
            </div>
          </div>
        </div>
      </header>

      <About isOpen={aboutOpen} />

      {(aboutOpen && !exitingBtn) || exitingBtn === 'close' ? (
        <button
          type="button"
          className={`btn-back btn-back--close ${exitingBtn === 'close' ? 'is-exiting' : ''}`}
          onClick={handleCloseClick}
          aria-label="Close about"
          disabled={!!exitingBtn}
        >
          <IconBox type="close" />
        </button>
      ) : null}

      {(!isHome && !aboutOpen && !exitingBtn) || exitingBtn === 'back' ? (
        <button
          type="button"
          className={`btn-back btn-back--back ${exitingBtn === 'back' ? 'is-exiting' : ''}`}
          onClick={handleBackClick}
          aria-label="Back to home"
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