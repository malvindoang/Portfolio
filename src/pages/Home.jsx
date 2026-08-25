import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Corners from '../components/Corners'
import { SECTIONS } from '../data/projects'
import './Home.css'

const CHAR_LIMIT = 8
const IDEAL_CHARS = 14
const MAX_VW = 9
const MIN_VW = 4
const GRID_GAP = 14

// Slot parkir: 01 TIDAK bergerak naik — slotnya = posisi awalnya saat scroll 0
// (padding-top .stage = 220). 02 & 03 "dijemput" dari bawah dan bertumpuk
// tepat di bawah 01. Sampai akhir page, 01 tetap di situ.
const SLOT_BASE = 220
const SLOT_STEP = 30
const PARK_BUFFER = 60 // toleransi deteksi "sudah parkir" untuk scrollspy

// JARAK TETAP anchor: tepi atas layar -> puncak judul pertama (HUB PKP) saat
// homepage pertama kali muncul (scroll 0). SEMUA klik 01/02/03 mendarat dengan
// jarak yang sama persis ini.
const ANCHOR_OFFSET = 263

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
  const lastY = useRef(0)
  const ticking = useRef(false)
  const settleTimer = useRef(null)
  const contentRefs = useRef([]) // .sectionBlock — dipakai scrollspy, anchor, DAN target skew

  const [activeSection, setActiveSection] = useState(0)
  const [gridLeft, setGridLeft] = useState(220)

  const handleGridWidth = useCallback((width) => {
    setGridLeft(40 + width + GRID_GAP)
  }, [])

  const updateActiveSection = useCallback(() => {
    let current = 0
    contentRefs.current.forEach((el, i) => {
      if (!el) return
      const top = el.getBoundingClientRect().top
      const slot = SLOT_BASE + i * SLOT_STEP
      if (top <= slot + PARK_BUFFER) current = i
    })
    setActiveSection((prev) => (prev !== current ? current : prev))
  }, [])

  // SKEW hanya untuk .sectionBlock (judul project) — label 01/02/03 TIDAK skew.
  useEffect(() => {
    lastY.current = window.scrollY
    updateActiveSection()

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY
          const velocity = currentY - lastY.current
          const skew = Math.max(-8, Math.min(8, velocity * 0.6))
          contentRefs.current.forEach((el) => {
            if (el) el.style.transform = `skewY(${skew}deg)`
          })
          lastY.current = currentY
          updateActiveSection()
          ticking.current = false
        })
        ticking.current = true
      }

      clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(() => {
        contentRefs.current.forEach((el) => {
          if (el) el.style.transform = 'skewY(0deg)'
        })
      }, 120)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(settleTimer.current)
    }
  }, [updateActiveSection])

  const handleSectionNavClick = (index) => {
    const block = contentRefs.current[index]
    if (!block) return

    const rect = block.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const targetY = rect.top + scrollTop - ANCHOR_OFFSET

    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  const sectionNav = SECTIONS.map((section, i) => ({
    label: section.label.includes('—')
      ? section.label.split('—')[1].trim()
      : section.label,
    active: activeSection === i,
    onClick: () => handleSectionNavClick(i),
  }))

  return (
    <>
      <Corners sectionNav={sectionNav} onGridWidth={handleGridWidth} />

      <div className="stage">
        <div className="list">
          {SECTIONS.map((section, sIdx) => (
            <div className="sectionGroup" key={section.label}>
              <div
                className={`sectionLabel${sIdx === activeSection ? ' sectionLabel--active' : ''}`}
                style={{ marginLeft: gridLeft, top: SLOT_BASE + sIdx * SLOT_STEP }}
              >
                {section.label}
              </div>

              <div
                className="sectionBlock"
                ref={(el) => (contentRefs.current[sIdx] = el)}
              >
                {section.projects.map((p, i) => {
                  const lines = getLines(p.title)
                  const fontSize = getFontSize(lines)

                  const rows = lines.map((line, li) => (
                    <div className="projectRow" key={li}>
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
                      <div className="title" style={{ fontSize }}>
                        {line}
                      </div>
                    </div>
                  ))

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
    </>
  )
}

export default Home