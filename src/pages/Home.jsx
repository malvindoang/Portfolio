import { useLayoutEffect, useRef, useState, useCallback } from 'react'
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

  const [activeSection, setActiveSection] = useState(0)
  const [gridLeft, setGridLeft] = useState(220)

  const handleGridWidth = useCallback((width) => {
    setGridLeft(40 + width + GRID_GAP)
  }, [])

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

  const getRowsForProject = (projectIndex) => {
    const rows = projectRowRefs.current
    const mapping = lineToProjectIndexRef.current
    const out = []
    for (let i = 0; i < rows.length; i++) {
      if (mapping[i] === projectIndex && rows[i]) out.push(rows[i])
    }
    return out
  }

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

    const measure = () => {
      space.style.height = `${150 + list.scrollHeight + 120}px`
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
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      ctx.revert()
    }
  }, [computeActiveSection])

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
                    const projectIndex = projectCounter++
                    nextProjectSlugs[projectIndex] = p.slug || null

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
                        >
                          {rows}
                        </Link>
                      )
                    }

                    return (
                      <div className="projectGroup" key={p.title + i}>
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