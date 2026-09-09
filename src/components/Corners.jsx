import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import LiveClock from './LiveClock'
import About from './About'
import { SECTIONS } from '../data/projects'
import './Corners.css'

// Gap antara kolom kiri (wordmark/nav) dan konten About —
// bodyLeft = 40 (gutter) + lebar kolom kiri + gap ini.
const GRID_GAP = 14

// Jumlah baris spacer tak-terlihat sebelum baris icon (back/close), supaya
// icon jatuh TEPAT di posisi baris terakhir sectionNav (mis. "03 — RESEARCH").
const ICON_ROW_SPACER_COUNT = Math.max(SECTIONS.length - 1, 0)

// ===== ENTRANCE LAYER 3 — WORDMARK MASK REVEAL =====
// Delay per baris (MALVIN / Front-end Developer / UI/UX Designer).
// Home: 2 / 2.2 / 2.35s. Halaman project (cepat): 0 / 0.2 / 0.35s.
const WORDMARK_DELAYS_HOME = [2, 2.2, 2.35]
const WORDMARK_DELAYS_PROJECT = [0, 0.2, 0.35]

// ===== ENTRANCE LAYER 4 — CORNER DIRECTIONAL =====
// Formula: delay(index) = base + index * 0.1s
// index 0,1   -> kiri-atas (about/works)
// index 0,1,2 -> kanan-atas (section nav / back, per baris)
// index 3     -> kanan-bawah (Jakarta + clock, satu blok)
// Home: base 2.5s (about/works & section nav mulai di 2.5s, br di 2.8s).
// Project: base 0.3s (about/works & back mulai di 0.3s, br di 0.6s).
const DIRECTIONAL_BASE_HOME = 2.5
const DIRECTIONAL_BASE_PROJECT = 0.3
const directionalDelay = (index, isHome) =>
  (isHome ? DIRECTIONAL_BASE_HOME : DIRECTIONAL_BASE_PROJECT) + index * 0.1

// Berapa lama flag "cornersIntro" tetap true. Harus >= delay+durasi
// terpanjang di layer 4 (home: 2.8 + 0.6 = 3.4s; project: 0.6 + 0.6 =
// 1.2s). Dipakai untuk MENCEGAH replay animasi saat About dibuka/tutup
// (lihat CornerIconRows & blok .corner.tr / .corner.br di bawah — kedua
// elemen itu unmount/remount saat aboutOpen toggle, jadi animasinya
// HARUS digate oleh state ini, bukan cuma class CSS statis).
const CORNERS_INTRO_MS_HOME = 3500
const CORNERS_INTRO_MS_PROJECT = 1300

// Baris icon (back / close) — dibungkus spacer identik supaya mendarat di
// slot baris ke-N. Icon digambar via CSS (geometri persis vanholtz):
// - back  : bar 25px + kepala ±45°, loop HORIZONTAL saat hover
// - close : dua bar 25px bersilangan, loop VERTIKAL saat hover
function CornerIconRows({ spacerCount, icon, onClick, ariaLabel, cornersIntro, isHome }) {
  const boxClass =
    icon === 'back' ? 'cornerIconBox cornerIconBox--x' : 'cornerIconBox cornerIconBox--y'

  // Icon jatuh di baris terakhir (index == spacerCount), jadi delay-nya
  // disamakan dengan posisi baris terakhir sectionNav (konsisten dgn
  // Layer 4 "section nav / back" di spec).
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
  // bodyLeft: margin kiri konten About. Default 220 = perkiraan masuk akal
  // sebelum pengukuran pertama selesai.
  const [bodyLeft, setBodyLeft] = useState(220)
  const wordmarkRef = useRef(null)
  const navLinksRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  // ===== GATE INTRO — FIRST LOAD ONLY =====
  // Kalau parent (Home) mengirim playIntro, pakai itu; kalau tidak
  // (mis. halaman project), baca flag window langsung: undefined saat
  // refresh/hard-load (= main), true setelah mount pertama sesi (= skip
  // di navigasi SPA).
  const [playIntroSelf] = useState(() => !window.__INTRO_DONE__)
  const playIntro = typeof playIntroProp === 'boolean' ? playIntroProp : playIntroSelf

  useEffect(() => {
    if (!playIntro) return undefined
    const t = setTimeout(() => {
      window.__INTRO_DONE__ = true
    }, 0)
    return () => clearTimeout(t)
  }, [playIntro])

  // Flag entrance aktif hanya di window waktu awal mount. Dipakai untuk
  // menggate animasi Layer 4 di elemen yang bisa unmount/remount akibat
  // toggle About (.corner.tr isinya, .corner.br).
  const [cornersIntro, setCornersIntro] = useState(true)
  useEffect(() => {
    const ms = isHome ? CORNERS_INTRO_MS_HOME : CORNERS_INTRO_MS_PROJECT
    const t = setTimeout(() => setCornersIntro(false), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gabungan gate: animasi corner hanya jalan kalau FIRST LOAD *dan*
  // masih dalam window cornersIntro (bukan replay karena toggle About).
  const introOn = playIntro && cornersIntro

  const wordmarkDelays = isHome ? WORDMARK_DELAYS_HOME : WORDMARK_DELAYS_PROJECT

  // FIX POINT 3 — useLayoutEffect (bukan useEffect): pengukuran + setBodyLeft
  // di-flush SEBELUM browser paint, jadi tidak ada "lompat" 1 frame saat
  // About dibuka. Hasil akhir sama: 40 + maxW + 14.
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

  // Sync aboutOpen ke body.about-open — dipakai ProjectDetail.css untuk
  // memaksa wordmark/nav/close jadi hitam & terlihat di halaman project.
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

  return (
    <>
      {/* Wordmark — bottom-left saat idle, pindah ke top-left saat about terbuka.
          ENTRANCE LAYER 3: tiap baris dibungkus .maskLine (overflow:hidden)
          + .maskInner yang slide dari translateX(-105%) -> 0. GATE: saat
          bukan first load, animation: 'none' -> wordmark langsung tampil
          di posisi final tanpa mask reveal. */}
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

      {/* Nav about / work(s) — tanpa nomor urut. Efek hover 3D perspective
          (anchor kiri) diterapkan murni via CSS — lihat Corners.css.
          ENTRANCE LAYER 4 (kiri-atas): translateX(-40px)+opacity0, per
          baris. GATE: hanya saat first load. */}
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

      {/* Corner kanan atas — SELALU dirender (about buka/tutup), supaya back &
          close menempati slot posisi yang SAMA PERSIS (baris "03").
          PENTING: isi div ini benar-benar swap (close-icon / sectionNav /
          back-icon / default-links) tiap aboutOpen toggle -> React
          unmount+remount baris-barisnya. Karena itu animasi Layer 4 di
          sini WAJIB digate oleh `introOn`, supaya toggle About SESUDAH
          intro selesai — dan semua navigasi SPA — TIDAK memicu animasi. */}
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
            onClick={onBack}
            cornersIntro={introOn}
            isHome={isHome}
          />
        ) : (
          <>
            <div
              className="row"
              style={
                introOn
                  ? {
                      animation: 'cornerFromRight 0.6s ease backwards',
                      animationDelay: `${directionalDelay(0, isHome)}s`,
                    }
                  : undefined
              }
            >
              <span className="num">03</span>
              <a href="https://www.linkedin.com/in/malvin-malvin-55974632b" target="_blank" rel="noreferrer">linkedin</a>
            </div>
            <div
              className="row"
              style={
                introOn
                  ? {
                      animation: 'cornerFromRight 0.6s ease backwards',
                      animationDelay: `${directionalDelay(1, isHome)}s`,
                    }
                  : undefined
              }
            >
              <span className="num">04</span>
              <a href="https://github.com/malvindoang" target="_blank" rel="noreferrer">github</a>
            </div>
            <div
              className="row"
              style={
                introOn
                  ? {
                      animation: 'cornerFromRight 0.6s ease backwards',
                      animationDelay: `${directionalDelay(2, isHome)}s`,
                    }
                  : undefined
              }
            >
              <span className="num">05</span>
              <a href="mailto:malvin15.doang@gmail.com">email</a>
            </div>
          </>
        )}
      </div>

      {/* Kontak (Jakarta + jam) — hilang instan saat about terbuka.
          Elemen ini UNMOUNT TOTAL saat aboutOpen jadi true, jadi kalau
          about ditutup lagi dia remount -> WAJIB digate introOn juga,
          pakai index 3 (satu slot setelah baris terakhir kanan atas)
          supaya delay-nya 2.8s (home) / 0.6s (project) sesuai spec. */}
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

      {/* bodyLeft dikirim ke About → margin-left inline (sejajar label Home) */}
      <About isOpen={aboutOpen} bodyLeft={bodyLeft} />
    </>
  )
}

export default Corners