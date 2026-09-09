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
// .list turun dari jauh di atas layar selama 3s. Ease sengaja LEBIH
// LINEAR DI TENGAH supaya container TERUS bergerak sampai judul
// terakhir menyala di 1.95s (kalau expo-out, container "parkir" dulu
// dan judul atas spawn di tempat).
const INTRO_OFFSET_DURATION_MS = 3000
const INTRO_EASE_NAME = 'vanholtzDescentEase'
CustomEase.create(INTRO_EASE_NAME, 'M0,0 C0.3,0.05,0.4,1 1,1')
const introEase = gsap.parseEase(INTRO_EASE_NAME)

// ===== ENTRANCE LAYER 2 — REVEAL PER PROJECT (SPIRAL: step 0.25s) =====
// Step 0.25s = selisih kemiringan antar tetangga ±9-12° selama jendela
// tengah intro = TANGGA SPIRAL TERBACA. Urutan DOM atas->bawah; paling
// bawah (0.2s) duluan, paling atas (1.95s) terakhir.
const INTRO_DELAYS = [1.95, 1.7, 1.45, 1.2, 0.95, 0.7, 0.45, 0.2]

// Micro-stagger fade antar BARIS dalam satu project (kehidupan internal).
const LINE_STAGGER_S = 0.09

// Section label (Layer 5): fade opacity, delay 1.0 / 1.15 / 1.3s ...
const SECTION_LABEL_DELAY_BASE = 1.0
const SECTION_LABEL_DELAY_STEP = 0.15

// Scroll-lock: descent selesai 3s; mayoritas judul mendarat ±3.5s.
const HOME_SCROLL_LOCK_MS = 3000

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

  // ===== GATE INTRO — FIRST LOAD ONLY =====
  // window.__INTRO_DONE__ hidup per page-load: undefined saat refresh/
  // hard-load (= main), true setelah mount pertama (= skip di semua
  // navigasi SPA home<->project). Corners.jsx membaca flag yang sama.
  const [playIntro] = useState(() => !window.__INTRO_DONE__)

  useEffect(() => {
    if (!playIntro) return undefined
    // Set setelah seluruh mount-wave commit selesai (setTimeout 0),
    // supaya Home DAN Corners di mount-wave yang sama sama-sama
    // kebagian nilai true; navigasi berikutnya baru membaca true.
    const t = setTimeout(() => {
      window.__INTRO_DONE__ = true
    }, 0)
    return () => clearTimeout(t)
  }, [playIntro])

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
      // Kompensasi offset intro: active-section tidak boleh "tertipu"
      // pergeseran visual entrance. Setelah intro = 0 -> no-op.
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

  // ===== SCROLL LOCK (home-intro) — HANYA saat first load =====
  useLayoutEffect(() => {
    if (!playIntro) return undefined
    document.body.classList.add('home-intro')
    const timer = setTimeout(() => {
      document.body.classList.remove('home-intro')
    }, HOME_SCROLL_LOCK_MS)

    return () => {
      clearTimeout(timer)
      document.body.classList.remove('home-intro')
    }
  }, [playIntro])

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

    // SATU baris additive: offset intro dijumlah ke transform scroll
    // normal. Setelah intro selesai offset = 0 permanen -> perilaku
    // scroll kembali identik seperti semula.
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
        // Kompensasi offset intro supaya labelDocTop = posisi dokumen asli
        labelDocTop[i] = rect.top + window.scrollY - introOffsetRef.current
      })
    }

    // ===== JARAK START DINAMIS =====
    // Target: project PALING BAWAH (delay terkecil) menyala tepat ±100px
    // di ATAS tepi atas viewport, lalu terlihat jatuh menyeberang layar.
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
        // Selesai: offset dikunci 0 permanen — nol residu.
        introOffsetRef.current = 0
        writeTranslate(window.scrollY)
        introRAF = null
      }
    }

    if (playIntro) {
      introOffsetStartRef.current = computeIntroOffsetStart()
      introOffsetRef.current = introOffsetStartRef.current
    } else {
      introOffsetRef.current = 0
    }

    measure()
    writeLabels(window.scrollY)
    setActiveSection(computeActiveSection())

    if (playIntro) {
      introRAF = requestAnimationFrame(stepIntro)
    }

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
      // Re-kalkulasi jarak start kalau resize terjadi SAAT intro berjalan
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
  }, [computeActiveSection, playIntro])

  useLayoutEffect(() => {
    let ticking = false
    let lastX = 0
    let lastY = 0

    const isOtherUiTarget = (target) =>
      !!target?.closest?.(
        '.corner, .navLinks, .navWordmark, .aboutOverlay, .aboutClose'
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

    /* Outline system (lihat Home.css): class .is-hovered mengubah judul
       dari fill solid ke outline saat hover masuk, dan mengembalikannya
       ke fill saat hover keluar. Ditumpangkan di handler rotasi GSAP
       yang sama supaya kedua efek selalu sinkron. */
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

  // Class no-intro mematikan semua CSS animation entrance di dalamnya
  // (lihat rule .no-intro di Home.css) saat bukan first load.
  const introClass = playIntro ? '' : ' no-intro'

  return (
    <>
      <Corners sectionNav={sectionNav} onGridWidth={handleGridWidth} playIntro={playIntro} />

      <div className={`stageSpace${introClass}`} ref={spaceRef}>
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

                    // Layer 2: delay swing per project (SPIRAL step 0.25s).
                    const groupDelay = INTRO_DELAYS[projectIndex] ?? 0

                    const rows = lines.map((line, li) => {
                      const globalLineIndex = lineCounter++
                      nextLineToProjectIndex[globalLineIndex] = projectIndex

                      return (
                        <div
                          className="projectRow"
                          key={li}
                          ref={(el) => (projectRowRefs.current[globalLineIndex] = el)}
                          // Micro-stagger fade per baris +0.09s.
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

      <div className={`labelLayer${introClass}`}>
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