import { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SECTIONS } from '../data/projects'
import './Home.css'

// ===== FASE 3.11: Prevent browser scroll restoration =====
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const CHAR_LIMIT = 8
const GRID_GAP = 14

const INTRO_DELAY_BASE = 0.9
const INTRO_DELAY_STEP = 0.1
const ENTRANCE_TOTAL_MS = 3000

// ===== FASE 3.9: EXIT TIMING (dari data matrix3d) =====
const EXIT_TOTAL_MS = 2000

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

function Home() {
  const navigate = useNavigate()

  const spaceRef = useRef(null)
  const stageMoverRef = useRef(null)
  const listRef = useRef(null)
  const projectRowRefs = useRef([])
  const projectGroupRefs = useRef([])
  const projectSlugsRef = useRef([])
  const lineToProjectIndexRef = useRef([])

  const projectToSectionRef = useRef([])

  const hoveredIndexRef = useRef(-1)
  const entranceActiveRef = useRef(false)
  const exitActiveRef = useRef(false)

  const [highlightedSectionIdx, setHighlightedSectionIdx] = useState(-1)

  // ===== FASE 3.11: SCROLL RESET (INSTANT) =====
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // ===== VIRTUAL SCROLL =====
  useLayoutEffect(() => {
    const space = spaceRef.current
    const list = listRef.current
    const mover = stageMoverRef.current
    if (!space || !list || !mover) return undefined

    const writeTranslate = (scrollY) => {
      list.style.transform = `translate3d(0, ${-scrollY}px, 0)`
    }

    const measure = () => {
      const h = list.scrollHeight
      space.style.height = `${h}px`
      mover.style.height = `${h}px`
      writeTranslate(window.scrollY)
    }

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        writeTranslate(window.scrollY)
        ticking = false
      })
    }

    measure()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', measure)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  // ===== ENTRANCE =====
  useLayoutEffect(() => {
    entranceActiveRef.current = true
    document.body.classList.add('home-intro')

    const t = setTimeout(() => {
      document.body.classList.remove('home-intro')
      entranceActiveRef.current = false
      console.log('✅ Entrance selesai (CSS), hover & klik aktif kembali')
    }, ENTRANCE_TOTAL_MS)

    return () => {
      clearTimeout(t)
      document.body.classList.remove('home-intro')
      entranceActiveRef.current = false
    }
  }, [])

  // ===== CLEANUP EXIT =====
  useEffect(() => {
    return () => {
      document.body.classList.remove('home-outro')
      if (stageMoverRef.current) {
        stageMoverRef.current.classList.remove('is-lifting')
      }
      exitActiveRef.current = false
    }
  }, [])

  const findHitIndex = useCallback((x, y) => {
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
  }, [])

  const setGroupHoverState = useCallback((projectIndex) => {
    if (entranceActiveRef.current) return
    if (exitActiveRef.current) return
    if (hoveredIndexRef.current === projectIndex) return

    const prevIndex = hoveredIndexRef.current
    hoveredIndexRef.current = projectIndex

    if (prevIndex >= 0) {
      const prevGroup = projectGroupRefs.current[prevIndex]
      if (prevGroup) prevGroup.classList.remove('is-hovered')
    }

    if (projectIndex >= 0) {
      const group = projectGroupRefs.current[projectIndex]
      if (group) group.classList.add('is-hovered')

      const sIdx = projectToSectionRef.current[projectIndex]
      setHighlightedSectionIdx(sIdx)
    } else {
      setHighlightedSectionIdx(-1)
    }
  }, [])

  useLayoutEffect(() => {
    let ticking = false
    let lastX = 0
    let lastY = 0

    const handleMouseMove = (e) => {
      lastX = e.clientX
      lastY = e.clientY
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (document.body.classList.contains('about-open')) {
          setGroupHoverState(-1)
          document.body.style.cursor = ''
          ticking = false
          return
        }
        if (e.target && e.target.closest('.ui, .aboutOverlay, .btn-back, .wordmark-wrap')) {
          setGroupHoverState(-1)
          document.body.style.cursor = ''
          ticking = false
          return
        }

        const idx = findHitIndex(lastX, lastY)
        const hasSlug = idx >= 0 && !!projectSlugsRef.current[idx]
        document.body.style.cursor = hasSlug ? 'pointer' : ''
        setGroupHoverState(idx)
        ticking = false
      })
    }

    const handleClick = (e) => {
      if (document.body.classList.contains('about-open')) {
        setGroupHoverState(-1)
        return
      }
      if (entranceActiveRef.current) return
      if (exitActiveRef.current) return
      if (e.target.closest('.ui, .btn-back, .aboutOverlay, .aboutClose')) return

      const idx = findHitIndex(e.clientX, e.clientY)
      const slug = idx >= 0 ? projectSlugsRef.current[idx] : null
      if (!slug) return

      exitActiveRef.current = true

      projectGroupRefs.current.forEach((el) => {
        if (el) el.style.animationDelay = ''
      })

      document.body.classList.add('home-outro')

      const totalProjects = projectGroupRefs.current.length

      projectGroupRefs.current.forEach((el, i) => {
        if (!el) return
        if (i === idx) {
          el.classList.add('is-clicked')
        } else {
          const awayDelay = (200 + (totalProjects - 1 - i) * 100) / 1000
          el.style.setProperty('--exit-delay', `${awayDelay}s`)
        }
      })

      setTimeout(() => {
        if (stageMoverRef.current) {
          stageMoverRef.current.classList.add('is-lifting')
        }
      }, 1400)

      setTimeout(() => {
        navigate(`/project/${slug}`)
      }, EXIT_TOTAL_MS)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
      document.body.style.cursor = ''
      projectGroupRefs.current.forEach((el) => {
        if (el) el.classList.remove('is-hovered')
      })
      hoveredIndexRef.current = -1
      setHighlightedSectionIdx(-1)
    }
  }, [findHitIndex, navigate, setGroupHoverState])

  let projectCounter = 0
  let lineCounter = 0
  const nextProjectSlugs = []
  const nextLineToProjectIndex = []

  return (
    <>
    
      <div className="stageSpace" ref={spaceRef}>
        <div className="stageFixed">
          <div className="stageMover" ref={stageMoverRef}>
            <div className="list" ref={listRef}>
              {SECTIONS.map((section, sIdx) => (
                <div className="sectionGroup" key={section.label}>
                  <div className="sectionBlock">
                    {section.projects.map((p) => {
                      const lines = p.homeLines || getLines(p.title)
                      const projectIndex = projectCounter++

                      projectToSectionRef.current[projectIndex] = sIdx
                      nextProjectSlugs[projectIndex] = p.slug || null

                      const introDelay = Math.max(0, INTRO_DELAY_BASE - projectIndex * INTRO_DELAY_STEP)

                      const rows = lines.map((line, li) => {
                        const globalLineIndex = lineCounter++
                        nextLineToProjectIndex[globalLineIndex] = projectIndex

                        return (
                          <div
                            className="projectRow"
                            key={li}
                            ref={(el) => (projectRowRefs.current[globalLineIndex] = el)}
                          >
                            <div className="meta">
                              {li === 0 ? (
                                <>
                                  <div className="year">{p.year}</div>
                                  <div className="slash" />
                                </>
                              ) : (
                                <div className="metaSpacer" />
                              )}
                            </div>
                            <div className="title">{line}</div>
                          </div>
                        )
                      })

                      if (p.slug) {
                        return (
                          <Link
                            to={`/project/${p.slug}`}
                            className="projectGroup"
                            key={p.title}
                            style={{ animationDelay: `${introDelay}s` }}
                            ref={(el) => (projectGroupRefs.current[projectIndex] = el)}
                          >
                            {rows}
                          </Link>
                        )
                      }

                      return (
                        <div
                          className="projectGroup"
                          key={p.title}
                          style={{ animationDelay: `${introDelay}s` }}
                          ref={(el) => (projectGroupRefs.current[projectIndex] = el)}
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
      </div>

      {(projectSlugsRef.current = nextProjectSlugs) && null}
      {(lineToProjectIndexRef.current = nextLineToProjectIndex) && null}

      {/* ===== SECTION LABELS: Menggunakan CSS Variable --grid-left dari Corners ===== */}
      <div className={`labelLayer ${highlightedSectionIdx >= 0 ? 'labelLayer--active' : ''}`}>
        {SECTIONS.map((section, sIdx) => (
          <div
            key={section.label}
            className={`sectionLabel ${highlightedSectionIdx === sIdx ? 'is-highlighted' : ''}`}
            style={{ left: 'var(--grid-left, 220px)', top: 220 + sIdx * 30 }}
          >
            {section.label}
          </div>
        ))}
      </div>
    </>
  )
}

export default Home