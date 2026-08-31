import { useEffect } from 'react'
import './About.css'

const SPECIALTIES = ['Front-end Development', 'UI/UX Design', 'Interactive Multimedia']

function About({ isOpen, onClose, bodyLeft }) {
  // SOLUSI GLOBAL — SATU LISTENER UNTUK BLOKIR SEMUA SCROLL KE BODY
  //
  // Kenapa listener di WINDOW (bukan di .aboutOverlay)?
  // Karena elemen Corners.jsx (wordmark, nav, location) adalah position:fixed
  // yang TIDAK berada di dalam .aboutOverlay. Kalau user scroll di area
  // corner (di luar overlay), event wheel langsung menembus ke body.
  // Dengan pasang listener di window: SEMUA wheel event di halaman
  // ditangkap, dan kita filter:
  //   - target di luar .aboutScroll → preventDefault (block body)
  //   - target di dalam .aboutScroll + di ujung → preventDefault
  //   - target di dalam .aboutScroll + bisa scroll → biarkan
  //
  // Ini berlaku untuk corner, close button, area kosong overlay, dll
  // — tanpa perlu patch per-elemen.
  useEffect(() => {
    if (!isOpen) return

    // 1. Lock body overflow + touch action (defense layer 1)
    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    // 2. Handler global untuk wheel (defense layer 2 — yang paling penting)
    const handleWheel = (e) => {
      const scrollContainer = e.target.closest?.('.aboutScroll')
      if (!scrollContainer) {
        // Target di LUAR .aboutScroll (corners, close btn, area kosong, dll)
        // → BLOCK total, jangan sampai ke body
        e.preventDefault()
        return
      }
      // Target di DALAM .aboutScroll — cek ujung
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const atTop = scrollTop === 0 && e.deltaY < 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0
      if (atTop || atBottom) {
        e.preventDefault() // di ujung → block bocor ke body
      }
    }

    // 3. Handler global untuk touch (defense layer 3 — mobile/tablet)
    const handleTouchMove = (e) => {
      const scrollContainer = e.target.closest?.('.aboutScroll')
      if (!scrollContainer) {
        e.preventDefault()
      }
      // touch di dalam .aboutScroll dibiarkan (overscroll-behavior:contain
      // di CSS sudah handle kasus ujung atas/bawah)
    }

    // 4. Block keyboard scroll (PageUp/PageDown/Space/Arrow) di body
    const handleKeydown = (e) => {
      const scrollContainer = e.target.closest?.('.aboutScroll')
      if (!scrollContainer) {
        const scrollKeys = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']
        if (scrollKeys.includes(e.key)) {
          e.preventDefault()
        }
      }
    }

    // passive: false WAJIB supaya preventDefault() bekerja
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('keydown', handleKeydown)

    // Cleanup: unlock body + lepas listener
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen])

  return (
    <div className={`aboutOverlay${isOpen ? ' aboutOverlay--open' : ''}`}>
      <button className="aboutClose" onClick={onClose} aria-label="Close about">×</button>

      <div className="aboutScroll">
        <div className="aboutContent" style={{ marginLeft: bodyLeft }}>
          <div className="aboutStatement">
            <p className="aboutLead">
              Building interactive digital experiences through responsive
              front-end development, thoughtful design, and engaging motion
              and interaction.
            </p>
            <p>
              Malvin is a front-end developer based in Jakarta, Indonesia,
              with a strong interest in creating interactive, animated, and
              responsive websites. Alongside front-end development, his
              background in UI/UX design allows him to approach digital
              experiences with an appreciation for both visual details and
              the way people interact with them.
            </p>
            <p>
              He enjoys exploring how design, motion, and interaction can
              work together to create websites that feel engaging, intuitive,
              and memorable. From translating ideas and designs into
              functional web experiences to experimenting with animations and
              interactions, he pays close attention to responsiveness,
              usability, and the small details that shape the overall
              experience. He believes that a well-crafted website should
              balance visual expression with functionality, creating an
              experience that goes beyond simply presenting information.
            </p>
            <p className="aboutContact">
              Feel free to get in touch via{' '}
              <a href="mailto:malvin15.doang@gmail.com" className="aboutLink">
                email
              </a>
              , connect with Malvin on{' '}
              <a
                href="https://www.linkedin.com/in/malvin-malvin-55974632b"
                target="_blank"
                rel="noreferrer"
                className="aboutLink"
              >
                LinkedIn
              </a>
              , or explore more of his work and experiments through{' '}
              <a
                href="https://github.com/malvindoang"
                target="_blank"
                rel="noreferrer"
                className="aboutLink"
              >
                GitHub
              </a>{' '}
              and{' '}
              <a
                href="https://www.instagram.com/malvin.15"
                target="_blank"
                rel="noreferrer"
                className="aboutLink"
              >
                Instagram
              </a>
              .
            </p>
          </div>

          <div className="aboutInfo">
            <div className="aboutInfoBlock">
              <h3>Specialties</h3>
              <ul>
                {SPECIALTIES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="aboutInfoBlock">
              <h3>Education</h3>
              <div className="aboutEdu">
                <strong>BINUS University Alam Sutera</strong>
                <span>Computer Science — Interactive Multimedia</span>
                <span>Graduating 2026</span>
              </div>
            </div>

            <div className="aboutInfoBlock">
              <h3>Experience</h3>
              <div className="aboutEdu">
                <strong>UI/UX Designer</strong>
                <span>Kementerian Perumahan dan Kawasan Pemukiman</span>
                <span>Sep 2025 – Feb 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About