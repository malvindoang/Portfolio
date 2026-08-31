import { useLayoutEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import Corners from '../components/Corners'
import { SECTIONS, getSectionShortLabel } from '../data/projects'
import './Home.css'

const CHAR_LIMIT = 8
const IDEAL_CHARS = 14
const MAX_VW = 12
const MIN_VW = 4
const GRID_GAP = 14

const SLOT_BASE = 220
const SLOT_STEP = 30
const PARK_BUFFER = 60

const ANCHOR_OFFSET = 263

// ============ FIXED-STAGE VIRTUAL SCROLL ============
// perspective & perspective-origin di .stageFixed STATIS (lihat Home.css),
// TIDAK PERNAH di-update via JS lagi. Kemiringan baris = rotationY konstan
// per baris (Effect utama, tetap sama). Scroll digerakkan lewat translate3d
// pada .list — kerja compositor, bukan reflow/re-proyeksi 3D main thread.
// ANGKA KUNCI — JANGAN DIUBAH tanpa instruksi eksplisit.
const PERSPECTIVE_VW = 75
const ROTATE_Y_DEG = -42

// FIX ALIGNMENT: jarak axis rotasi dari tepi kanan .projectGroup.
// HARUS SAMA PERSIS dengan `right: 40px` di .tr/.br (Corners.css) DAN
// dengan `padding-right` di .projectRow (Home.css). Titik yang tepat
// berada di axis rotasi (x = origin, z = 0) TIDAK bergerak sama sekali
// berapa pun ROTATE_Y_DEG-nya — jadi kalau ketiga angka ini identik,
// tepi kanan teks selalu jatuh persis di garis corner.
const RIGHT_ANCHOR_PX = 40

// ============ SKEW ON-SCROLL (desain asli Malvin) =====================
// KONSTANTA disimpan — efeknya DIMATIKAN via comment di Effect 3.
const SKEW_FACTOR = 0.06
const SKEW_MAX_DEG = 5
const SKEW_SETTLE_DELAY = 120

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
  const projectRefs = useRef([])
  const projectSlugsRef = useRef([]) // paralel index dgn projectRefs — slug per project (atau null)
  const contentRefs = useRef([]) // .sectionBlock — calon pemilik skewY (nonaktif)

  const [activeSection, setActiveSection] = useState(0)
  const [gridLeft, setGridLeft] = useState(220)

  const handleGridWidth = useCallback((width) => {
    setGridLeft(40 + width + GRID_GAP)
  }, [])

  // Fungsi murni — dipakai untuk hitung awal DAN di dalam scroll handler
  // gabungan di bawah. Tidak melakukan state update di sini (READ only).
  // Tetap valid: anchor adalah node DOM nyata yang ikut translate3d
  // .list, jadi getBoundingClientRect()-nya selalu benar terhadap scroll.
  const computeActiveSection = useCallback(() => {
    let current = 0
    anchorRefs.current.forEach((el, i) => {
      if (!el) return
      const top = el.getBoundingClientRect().top
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

  // ============ EFFECT UTAMA — TRANSLATE3D VIRTUAL SCROLL ============
  // Tidak ada lagi write ke perspective-origin per frame (akar lag lama).
  // Satu scroll listener, satu rAF, urutan tegas READ → WRITE:
  // 1) READ scrollY + hitung activeSection dari anchor rects
  // 2) WRITE translate3d(.list) + top setiap label (.labelLayer) + state
  useLayoutEffect(() => {
    const space = spaceRef.current
    const list = listRef.current
    if (!space || !list) return undefined

    // --- rotationY + origin per baris (sekali saat mount, ulang saat
    //     resize). Bukan bagian dari loop scroll. ---
    const applyRowTransforms = () => {
      const rows = projectRefs.current.filter(Boolean)
      rows.forEach((row) => {
        const originX = row.offsetWidth - RIGHT_ANCHOR_PX
        gsap.set(row, {
          rotationY: ROTATE_Y_DEG,
          transformOrigin: `${originX}px center`,
        })
      })
    }

    const ctx = gsap.context(() => {
      applyRowTransforms()
    })

    const labelDocTop = labelDocTopRef.current

    const writeTranslate = (scrollY) => {
      list.style.transform = `translate3d(0, ${-scrollY}px, 0)`
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

    // measure() = spacer height + labelDocTop, dibaca SEKALI (mount) dan
    // ULANG hanya saat resize — bukan per frame scroll.
    const measure = () => {
      space.style.height = `${150 + list.scrollHeight + 120}px`

      // translate harus sinkron dengan scrollY saat ini SEBELUM membaca
      // rect anchor, supaya labelDocTop yang dihitung benar-benar
      // posisi dokumen (rect.top + scrollY), bukan posisi ter-translate.
      writeTranslate(window.scrollY)

      anchorRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        labelDocTop[i] = rect.top + window.scrollY
      })
    }

    measure()
    writeLabels(window.scrollY)
    setActiveSection(computeActiveSection())

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        // ---- FASE READ ----
        const scrollY = window.scrollY
        const nextActive = computeActiveSection()

        // ---- FASE WRITE ----
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
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      ctx.revert()
    }
  }, [computeActiveSection])

  // ============ EFFECT HIT-TEST 3D — LEVEL 3 (JS FALLBACK) ============
  // Chrome tidak akurat melakukan native hit-test untuk elemen di dalam
  // preserve-3d bertingkat → hit-test manual via getBoundingClientRect()
  // (selalu akurat mengikuti proyeksi 3D final).
  // EFEK HOVER VISUAL DIHAPUS TOTAL (keputusan final) — effect ini kini
  // HANYA mengurus: cursor pointer saat di atas project ber-slug, dan
  // navigasi klik via navigate(). Seluruh pohon tetap pointer-events:none;
  // <Link> asli hanya untuk a11y/SEO.
  useLayoutEffect(() => {
    let ticking = false
    let lastX = 0
    let lastY = 0

    // Elemen UI lain yang punya pointer-events sendiri (nav, corner,
    // overlay about) — jangan ditimpa cursor project.
    const isOtherUiTarget = (target) =>
      !!target?.closest?.(
        '.corner, .navLinks, .navWordmark, .aboutOverlay, .aboutClose'
      )

    const findHitIndex = (x, y) => {
      const groups = projectRefs.current
      for (let i = groups.length - 1; i >= 0; i--) {
        const el = groups[i]
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return i
        }
      }
      return -1
    }

    const applyCursor = (index) => {
      const hasSlug = index >= 0 && !!projectSlugsRef.current[index]
      document.body.style.cursor = hasSlug ? 'pointer' : ''
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
      if (isOtherUiTarget(e.target)) return
      const index = findHitIndex(e.clientX, e.clientY)
      const slug = index >= 0 ? projectSlugsRef.current[index] : null
      if (slug) navigate(`/project/${slug}`)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      document.body.style.cursor = ''
    }
  }, [navigate])

  /* ==== EFFECT 3 — SKEW ON-SCROLL: DIMATIKAN (di-comment, bukan dihapus) ====
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return undefined

    const blocks = contentRefs.current.filter(Boolean)
    if (!blocks.length) return undefined

    const setters = blocks.map((el) =>
      gsap.quickTo(el, 'skewY', { duration: 0.25, ease: 'power2.out' })
    )

    let lastY = window.scrollY
    let ticking = false
    let settleTimer = null

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          const y = window.scrollY
          const v = y - lastY
          const skew = Math.max(
            -SKEW_MAX_DEG,
            Math.min(SKEW_MAX_DEG, -v * SKEW_FACTOR)
          )
          setters.forEach((s) => s(skew))
          lastY = y
          ticking = false
        })
      }
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        setters.forEach((s) => s(0))
      }, SKEW_SETTLE_DELAY)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(settleTimer)
    }
  }, [])
  ==== AKHIR EFFECT 3 (nonaktif) ==== */

  const sectionNav = SECTIONS.map((section, i) => ({
    label: getSectionShortLabel(section.label),
    active: activeSection === i,
    onClick: () => handleSectionNavClick(i),
  }))

  let rowCounter = 0
  const nextProjectSlugs = [] // dibangun ulang tiap render, disinkronkan ke ref setelah loop

  return (
    <>
      <Corners sectionNav={sectionNav} onGridWidth={handleGridWidth} />

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
                    const rowIndex = rowCounter++
                    nextProjectSlugs[rowIndex] = p.slug || null

                    const rows = lines.map((line, li) => (
                      <div className="projectRow" key={li}>
                        <div className="meta">
                          {li === 0 ? (
                            <>
                              <div className="year">{p.year}</div>
                              {/* Slash proporsional: 70% dari fontSize
                                  title baris ini. */}
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
                    ))

                    const rowProps = {
                      ref: (el) => (projectRefs.current[rowIndex] = el),
                    }

                    // <Link>/div TETAP dirender untuk a11y & SEO; navigasi
                    // sesungguhnya via Effect hit-test JS (pointer-events
                    // seluruh pohon = none, lihat Home.css).
                    if (p.slug) {
                      return (
                        <Link
                          to={`/project/${p.slug}`}
                          className="projectGroup"
                          key={p.title + i}
                          {...rowProps}
                        >
                          {rows}
                        </Link>
                      )
                    }

                    return (
                      <div className="projectGroup" key={p.title + i} {...rowProps}>
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

      <div className="labelLayer">
        {SECTIONS.map((section, sIdx) => (
          <div
            key={section.label}
            className={`sectionLabel${sIdx === activeSection ? ' sectionLabel--active' : ''}`}
            style={{ left: gridLeft }}
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