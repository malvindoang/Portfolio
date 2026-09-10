import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import Corners from '../components/Corners'
import { SECTIONS, getSectionShortLabel } from '../data/projects'
import './Home.css'

gsap.registerPlugin(CustomEase)

const CHAR_LIMIT = 8
const IDEAL_CHARS = 14
const MAX_VW = 12
const MIN_VW = 4
const GRID_GAP = 14

const SLOT_BASE = 220
const SLOT_STEP = 30
const PARK_BUFFER = 60

const ANCHOR_OFFSET = 263

const PERSPECTIVE_VW = 75
const ROTATE_Y_DEG = -42

const RIGHT_ANCHOR_PX = 40

const HOVER_ROT_DEG = -24
const HOVER_DURATION = 0.7
const HOVER_EASE_NAME = 'vanholtzPop'
CustomEase.create(HOVER_EASE_NAME, 'M0,0 C0.075,0.82 0.165,1 1,1')

// ===== ENTRANCE LAYER 1 — CONTAINER DESCENT (JS, clip diam) =====
const INTRO_OFFSET_DURATION_MS = 3000
const INTRO_EASE_NAME = 'vanholtzDescentEase'
CustomEase.create(INTRO_EASE_NAME, 'M0,0 C0.3,0.05,0.4,1 1,1')
const introEase = gsap.parseEase(INTRO_EASE_NAME)

// ===== ENTRANCE LAYER 2 — REVEAL PER PROJECT (SPIRAL: step 0.25s) =====
const INTRO_DELAYS = [1.95, 1.7, 1.45, 1.2, 0.95, 0.7, 0.45, 0.2]

// Micro-stagger fade antar BARIS dalam satu project (kehidupan internal).
const LINE_STAGGER_S = 0.09

// Section label (Layer 5): fade opacity, delay 1.0 / 1.15 / 1.3s ...
const SECTION_LABEL_DELAY_BASE = 1.0
const SECTION_LABEL_DELAY_STEP = 0.15

// Scroll-lock: descent selesai 3s; mayoritas judul mendarat ±3.5s.
const HOME_SCROLL_LOCK_MS = 3000

// ===== POSISI SCROLL HOME TERAKHIR =====
// Disimpan saat Home ditinggalkan (unmount), dipakai untuk restore saat
// kembali via tombol back — meniru perilaku browser back yang mengembalikan
// posisi scroll halaman sebelumnya. Module-level supaya lolos StrictMode.
let lastHomeScrollY = 0

function getLines(title) {
  const words = title.split(' ')
  const lines = []
  let current = ''
  let hyphenUsed = false

  for (let word of words) {
    while (word.length > 0) {
      const sep = current ? ' ' : ''
      const testLine = current + sep + word
      if (testLine.length <= CHAR_LIMIT) {
        current = testLine
        word = ''
      } else if (current) {
        lines.push(current)
        current = ''
      } else if (!hyphenUsed) {
        const takeLen = CHAR_LIMIT - 1
        lines.push(word.slice(0, takeLen) + '-')
        word = word.slice(takeLen)
        hyphenUsed = true
      } else {
        lines.push(word)
        word = ''
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

function getFontSize(lines) {
  const longest = Math.max(...lines.map((l) => l.length))
  const scale = Math.min(1, IDEAL_CHARS / longest)
  return `${Math.max(MIN_VW, MAX_VW * scale)}vw`
}

function Home() {
  const navigate = useNavigate()

  const spaceRef = useRef(null)
  const listRef = useRef(null)
  const anchorRefs = useRef([])
  const labelRefs = useRef([])
  const labelDocTopRef = useRef([])
  const projectRowRefs = useRef([])
  const lineToProjectIndexRef = useRef([])
  const projectSlugsRef = useRef([])
  const contentRefs = useRef([])
  const hoveredIndexRef = useRef(-1)

  // ===== FLAG FIRST-LOAD — KHUSUS UNTUK CORNERS =====
  const [playIntro] = useState(() => !window.__INTRO_DONE__)

  useEffect(() => {
    if (!playIntro) return undefined
    const t = setTimeout(() => {
      window.__INTRO_DONE__ = true
    }, 0)
    return () => clearTimeout(t)
  }, [playIntro])

  // ===== TOMBOL BACK vs WORDMARK — CAPTURE KE REF (STRICTMODE-SAFE) =====
  // useRef dipertahankan antar pass StrictMode. true = kembali via tombol
  // back (jangan reset scroll, jangan lock overflow); false = wordmark /
  // refresh / link lain (reset scroll ke atas + lock seperti biasa).
  const skipScrollRef = useRef(window.__SKIP_HOME_SCROLL_RESET__ === true)

  // ===== ENTRANCE LAYER 1 — offset live (px, <=0), additive ke scroll =====
  const introOffsetRef = useRef(0)
  const introOffsetStartRef = useRef(0)

  const [activeSection, setActiveSection] = useState(0)
  const [gridLeft, setGridLeft] = useState(220)

  const handleGridWidth = useCallback((width) => {
    setGridLeft(40 + width + GRID_GAP)
  }, [])

  const computeActiveSection = useCallback(() => {
    let current = 0
    anchorRefs.current.forEach((el, i) => {
      if (!el) return
      const top = el.getBoundingClientRect().top - introOffsetRef.current
      const slot = SLOT_BASE + i * SLOT_STEP
      if (top <= slot + PARK_BUFFER) current = i
    })
    return current
  }, [])

  const handleSectionNavClick = (index) => {
    const anchor = anchorRefs.current[index]
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const targetY = rect.top + scrollTop - ANCHOR_OFFSET

    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  const getRowsForProject = (projectIndex) => {
    const rows = projectRowRefs.current
    const mapping = lineToProjectIndexRef.current
    const out = []
    for (let i = 0; i < rows.length; i++) {
      if (mapping[i] === projectIndex && rows[i]) out.push(rows[i])
    }
    return out
  }

  // ===== SIMPAN POSISI SCROLL SAAT HOME DITINGGALKAN =====
  // Cleanup useEffect ini jalan tepat sebelum Home unmount (ke project),
  // merekam posisi scroll home terakhir untuk restore saat kembali.
  useEffect(() => {
    return () => {
      lastHomeScrollY = window.scrollY
    }
  }, [])

  // ===== SCROLL LOCK (home-intro) =====
  // PENTING: saat kembali via tombol back (skipScrollRef true), lock
  // TIDAK dipasang. body.home-intro { overflow:hidden } membuat dokumen
  // tidak scrollable -> browser clamp scroll ke 0. Itu penyebab scroll
  // selalu lompat ke atas setiap kembali ke home sebelumnya.
  useLayoutEffect(() => {
    if (skipScrollRef.current) return undefined

    document.body.classList.add('home-intro')
    const timer = setTimeout(() => {
      document.body.classList.remove('home-intro')
    }, HOME_SCROLL_LOCK_MS)

    return () => {
      clearTimeout(timer)
      document.body.classList.remove('home-intro')
    }
  }, [])

  // ===== RESET SCROLL (WORDMARK / REFRESH) + BERSIHKAN FLAG =====
  useLayoutEffect(() => {
    if (window.__SKIP_HOME_SCROLL_RESET__) {
      delete window.__SKIP_HOME_SCROLL_RESET__
    }
    if (!skipScrollRef.current) {
      window.scrollTo(0, 0)
    }
  }, [])

  useLayoutEffect(() => {
    const space = spaceRef.current
    const list = listRef.current
    if (!space || !list) return undefined

    const applyRowTransforms = () => {
      const mapping = lineToProjectIndexRef.current
      projectRowRefs.current.forEach((row, i) => {
        if (!row) return
        const originX = row.offsetWidth - RIGHT_ANCHOR_PX
        const isHovered = mapping[i] === hoveredIndexRef.current
        gsap.set(row, {
          rotationY: isHovered ? HOVER_ROT_DEG : ROTATE_Y_DEG,
          transformOrigin: `${originX}px center`,
        })
      })
    }

    const ctx = gsap.context(() => {
      applyRowTransforms()
    })

    const labelDocTop = labelDocTopRef.current

    const writeTranslate = (scrollY) => {
      list.style.transform = `translate3d(0, ${-scrollY + introOffsetRef.current}px, 0)`
    }

    const writeLabels = (scrollY) => {
      anchorRefs.current.forEach((el, i) => {
        const labelEl = labelRefs.current[i]
        if (!labelEl) return
        const docTop = labelDocTop[i] ?? 0
        const top = Math.max(SLOT_BASE + i * SLOT_STEP, docTop - scrollY)
        labelEl.style.top = `${top}px`
      })
    }

    const measure = () => {
      space.style.height = `${150 + list.scrollHeight + 120}px`
      writeTranslate(window.scrollY)

      anchorRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        labelDocTop[i] = rect.top + window.scrollY - introOffsetRef.current
      })
    }

    const computeIntroOffsetStart = () => {
      const posDokumenUIUX = list.scrollHeight - 120
      const firstReveal = Math.min(...INTRO_DELAYS)
      const progressAtReveal = firstReveal / (INTRO_OFFSET_DURATION_MS / 1000)
      const easedAtReveal = introEase(progressAtReveal)
      const remainingFactor = 1 - easedAtReveal
      return -(posDokumenUIUX + 100) / remainingFactor
    }

    let introFrameStart = null
    let introRAF = null

    const stepIntro = (now) => {
      if (introFrameStart === null) introFrameStart = now
      const elapsed = now - introFrameStart
      const progress = Math.min(elapsed / INTRO_OFFSET_DURATION_MS, 1)
      const eased = introEase(progress)
      introOffsetRef.current = introOffsetStartRef.current * (1 - eased)
      writeTranslate(window.scrollY)

      if (progress < 1) {
        introRAF = requestAnimationFrame(stepIntro)
      } else {
        introOffsetRef.current = 0
        writeTranslate(window.scrollY)
        introRAF = null
      }
    }

    introOffsetStartRef.current = computeIntroOffsetStart()
    introOffsetRef.current = introOffsetStartRef.current

    measure()

    // ===== RESTORE POSISI SCROLL HOME (TOMBOL BACK) =====
    // Setelah tinggi dokumen benar (measure), kembalikan posisi scroll
    // home terakhir supaya persis seperti browser back. Sinkronisasi
    // ulang transform + label + section aktif ke scrollY baru.
    if (skipScrollRef.current) {
      window.scrollTo(0, lastHomeScrollY)
      writeTranslate(window.scrollY)
      writeLabels(window.scrollY)
      setActiveSection(computeActiveSection())
    } else {
      writeLabels(window.scrollY)
      setActiveSection(computeActiveSection())
    }

    introRAF = requestAnimationFrame(stepIntro)

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const nextActive = computeActiveSection()

        writeTranslate(scrollY)
        writeLabels(scrollY)
        setActiveSection((prev) => (prev !== nextActive ? nextActive : prev))

        ticking = false
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const handleResize = () => {
      applyRowTransforms()
      measure()
      writeLabels(window.scrollY)
      if (introRAF !== null) {
        introOffsetStartRef.current = computeIntroOffsetStart()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (introRAF !== null) cancelAnimationFrame(introRAF)
      ctx.revert()
    }
  }, [computeActiveSection])

  useLayoutEffect(() => {
    let ticking = false
    let lastX = 0
    let lastY = 0

    const isOtherUiTarget = (target) =>
      !!target?.closest?.(
        '.corner, .navLinks, .navWordmark', '.aboutOverlay, .aboutClose'
      )

    const findHitIndex = (x, y) => {
      const rows = projectRowRefs.current
      const mapping = lineToProjectIndexRef.current
      for (let i = rows.length - 1; i >= 0; i--) {
        const el = rows[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return mapping[i]
        }
      }
      return -1
    }

    const setRowHoverState = (projectIndex) => {
      if (hoveredIndexRef.current === projectIndex) return
      const prevIndex = hoveredIndexRef.current
      hoveredIndexRef.current = projectIndex

      if (prevIndex >= 0) {
        const prevRows = getRowsForProject(prevIndex)
        if (prevRows.length) {
          gsap.to(prevRows, {
            rotationY: ROTATE_Y_DEG,
            duration: HOVER_DURATION,
            ease: HOVER_EASE_NAME,
            overwrite: 'auto',
          })
          prevRows.forEach((row) => row.classList.remove('is-hovered'))
        }
      }

      if (projectIndex >= 0) {
        const rows = getRowsForProject(projectIndex)
        if (rows.length) {
          gsap.to(rows, {
            rotationY: HOVER_ROT_DEG,
            duration: HOVER_DURATION,
            ease: HOVER_EASE_NAME,
            overwrite: 'auto',
          })
          rows.forEach((row) => row.classList.add('is-hovered'))
        }
      }
    }

    const applyCursor = (projectIndex) => {
      const hasSlug = projectIndex >= 0 && !!projectSlugsRef.current[projectIndex]
      document.body.style.cursor = hasSlug ? 'pointer' : ''
      setRowHoverState(projectIndex)
    }

    const handleMouseMove = (e) => {
      if (isOtherUiTarget(e.target)) {
        applyCursor(-1)
        return
      }
      lastX = e.clientX
      lastY = e.clientY
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        applyCursor(findHitIndex(lastX, lastY))
        ticking = false
      })
    }

    const handleClick = (e) => {
      if (document.body.classList.contains('home-intro')) return
      if (isOtherUiTarget(e.target)) return
      const projectIndex = findHitIndex(e.clientX, e.clientY)
      const slug = projectIndex >= 0 ? projectSlugsRef.current[projectIndex] : null
      if (slug) navigate(`/project/${slug}`)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      document.body.style.cursor = ''
      gsap.killTweensOf(projectRowRefs.current.filter(Boolean))
      hoveredIndexRef.current = -1
    }
  }, [navigate])

  const sectionNav = SECTIONS.map((section, i) => ({
    label: getSectionShortLabel(section.label),
    active: activeSection === i,
    onClick: () => handleSectionNavClick(i),
  }))

  let projectCounter = 0
  let lineCounter = 0
  const nextProjectSlugs = []
  const nextLineToProjectIndex = []

  return (
    <>
      <Corners sectionNav={sectionNav} onGridWidth={handleGridWidth} playIntro={playIntro} />

      <div className="stageSpace" ref={spaceRef}>
        <div
          className="stageFixed"
          style={{ perspective: `${PERSPECTIVE_VW}vw` }}
        >
          <div className="list" ref={listRef}>
            {SECTIONS.map((section, sIdx) => (
              <div className="sectionGroup" key={section.label}>
                <span
                  className="sectionAnchor"
                  aria-hidden="true"
                  ref={(el) => (anchorRefs.current[sIdx] = el)}
                />

                <div
                  className="sectionBlock"
                  ref={(el) => (contentRefs.current[sIdx] = el)}
                >
                  {section.projects.map((p, i) => {
                    const lines = getLines(p.title)
                    const fontSize = getFontSize(lines)
                    const projectIndex = projectCounter++
                    nextProjectSlugs[projectIndex] = p.slug || null

                    const groupDelay = INTRO_DELAYS[projectIndex] ?? 0

                    const rows = lines.map((line, li) => {
                      const globalLineIndex = lineCounter++
                      nextLineToProjectIndex[globalLineIndex] = projectIndex

                      return (
                        <div
                          className="projectRow"
                          key={li}
                          ref={(el) => (projectRowRefs.current[globalLineIndex] = el)}
                          style={{
                            animationDelay: `${(groupDelay + li * LINE_STAGGER_S).toFixed(2)}s`,
                          }}
                        >
                          <div className="meta">
                            {li === 0 ? (
                              <>
                                <div className="year">{p.year}</div>
                                <div
                                  className="slash"
                                  style={{ height: `calc(${fontSize} * 0.70)` }}
                                />
                              </>
                            ) : (
                              <div className="metaSpacer" />
                            )}
                          </div>
                          <div className="title" style={{ fontSize }}>
                            {line}
                          </div>
                        </div>
                      )
                    })

                    if (p.slug) {
                      return (
                        <Link
                          to={`/project/${p.slug}`}
                          className="projectGroup"
                          key={p.title + i}
                          style={{ animationDelay: `${groupDelay}s` }}
                        >
                          {rows}
                        </Link>
                      )
                    }

                    return (
                      <div
                        className="projectGroup"
                        key={p.title + i}
                        style={{ animationDelay: `${groupDelay}s` }}
                      >
                        {rows}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(projectSlugsRef.current = nextProjectSlugs) && null}
      {(lineToProjectIndexRef.current = nextLineToProjectIndex) && null}

      <div className="labelLayer">
        {SECTIONS.map((section, sIdx) => (
          <div
            key={section.label}
            className={`sectionLabel${sIdx === activeSection ? ' sectionLabel--active' : ''}`}
            style={{
              left: gridLeft,
              animationDelay: `${SECTION_LABEL_DELAY_BASE + sIdx * SECTION_LABEL_DELAY_STEP}s`,
            }}
            ref={(el) => (labelRefs.current[sIdx] = el)}
          >
            {section.label}
          </div>
        ))}
      </div>
    </>
  )
}

export default Home