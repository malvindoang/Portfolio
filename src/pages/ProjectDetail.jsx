import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Corners from '../components/Corners'
import { PROJECT_CONTENT } from '../data/projectContent'
import { SECTIONS } from '../data/projects'
import { useInView } from '../hooks/useInView'
import './ProjectDetail.css'

const ALL_PROJECTS = SECTIONS.flatMap((s) => s.projects)

function ProjectDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const content = PROJECT_CONTENT[slug]
  const heroRef = useRef(null)
  const nextTitleRef = useRef(null)

  const ownerProject = ALL_PROJECTS.find((p) => p.slug === slug)
  const projectTheme = ownerProject?.theme || 'red'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    document.body.classList.add('page-project', `theme-${projectTheme}`)
    return () => {
      document.body.classList.remove('page-project', `theme-${projectTheme}`)
    }
  }, [projectTheme])

  const [introRef, introInView] = useInView()
  const [closingRef, closingInView] = useInView()

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight

      const r = heroRef.current?.getBoundingClientRect()
      const overHero = r ? r.top < 90 && r.bottom > 90 : false
      document.body.classList.toggle('on-hero', overHero)

      const heroCoversWordmark = r ? r.bottom > vh - 118 : false
      document.body.classList.toggle('wordmark-hidden', heroCoversWordmark)

      // ===== TRIGGER ON: reading mode =====
      // Aktif tepat saat scroll mencapai 50px pertama — sederhana
      // dan konsisten di semua viewport.
      const readingOn = window.scrollY >= 50

      // ===== TRIGGER OFF: reading mode =====
      // Anchor = tepi atas JUDUL next project (bukan section-nya).
      // About/works/.sub baru muncul kembali tepat saat judul outline
      // besarnya masuk viewport. Fallback ke closing kalau next tidak
      // dirender.
      const nextTitleRect = nextTitleRef.current?.getBoundingClientRect()
      const closingRect = closingRef.current?.getBoundingClientRect()
      const reachedNext = nextTitleRect
        ? nextTitleRect.top < vh
        : closingRect
        ? closingRect.top < vh
        : false

      document.body.classList.toggle('reading-mode', readingOn && !reachedNext)
    }

    update()

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', update)
      document.body.classList.remove('on-hero')
      document.body.classList.remove('wordmark-hidden')
      document.body.classList.remove('reading-mode')
    }
  }, [])

  if (!content) return <Navigate to="/" replace />

  const currentIndex = ALL_PROJECTS.findIndex((p) => p.slug === slug)
  const nextProject = ALL_PROJECTS[(currentIndex + 1) % ALL_PROJECTS.length]
  const nextTo = nextProject?.slug ? `/project/${nextProject.slug}` : '/'

  const heroImage = content.hero

  return (
    <>
      <Corners onBack={() => navigate('/')} />

      <article className="detail">
        <section ref={heroRef} className="detailHero">
          {heroImage && (
            <>
              <img
                className="detailHeroImage"
                src={heroImage}
                alt={content.title}
              />
              <div className="detailHeroOverlay" aria-hidden="true" />
            </>
          )}

          <h1 className="detailHeroTitle">
            {content.heroLines
              ? content.heroLines.map((line, i) => (
                  <span
                    key={line}
                    className={
                      i < content.heroLines.length - 1
                        ? 'detailHeroTitleLine detailHeroTitleLine--top'
                        : 'detailHeroTitleLine'
                    }
                  >
                    {line}
                  </span>
                ))
              : content.title}
          </h1>
        </section>

        <div className="editorialContainer">
          <section ref={introRef} className="editorialIntroRow">
            <div
              className={`editorialIntroLead reveal ${
                introInView ? 'inView' : ''
              }`}
            >
              {content.intro}
            </div>

            <div
              className={`editorialIntroBody reveal ${
                introInView ? 'inView' : ''
              }`}
            >
              {content.approach}
            </div>

            <div
              className={`editorialRail editorialFacts reveal ${
                introInView ? 'inView' : ''
              }`}
            >
              <div className="factRow">
                <span className="factLabel">Role:</span>{' '}
                <span className="factValue">{content.role}</span>
              </div>
              <div className="factRow">
                <span className="factLabel">Tools:</span>{' '}
                <span className="factValue">{content.tools}</span>
              </div>
              <div className="factRow">
                <span className="factLabel">Year:</span>{' '}
                <span className="factValue">{content.year}</span>
              </div>
              <div className="factRow">
                <span className="factLabel">Duration:</span>{' '}
                <span className="factValue">{content.duration}</span>
              </div>
              <div className="factRow">
                <span className="factLabel">Team:</span>{' '}
                <span className="factValue">{content.team}</span>
              </div>
            </div>
          </section>

          {content.sections.map((section, index) => (
            <ProjectSection key={section.title} section={section} index={index} />
          ))}

          <section ref={closingRef} className="detailClosing">
            <p
              className={`detailParagraph detailClosingText reveal ${
                closingInView ? 'inView' : ''
              }`}
            >
              {content.closing}
            </p>
          </section>

          {content.figma && (
            <div className="detailFigmaWrap">
              <FigmaSpecTag
                href={content.figmaUrl || '#'}
                target={content.figmaUrl ? '_blank' : undefined}
                rel={content.figmaUrl ? 'noreferrer' : undefined}
              />
            </div>
          )}

          {nextProject && nextProject.title !== content.title && (
            <div className="detailNextSection">
              <span className="detailNextLabel">Next project</span>
              <Link to={nextTo} className="detailNextPerspective">
                <span ref={nextTitleRef} className="detailNextTitle">
                  {nextProject.title}
                </span>
              </Link>
            </div>
          )}
        </div>
      </article>
    </>
  )
}

// ==== SPEC TAG — Opsi 1: "The working file" ====
// Arrow HANYA di teks utama. Label murni penanda status, tanpa arrow.
function FigmaSpecTag({ href, target, rel }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className="detailFigmaSpecTag"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="detailFigmaSpecLine" aria-hidden="true" />
      <span className="detailFigmaSpecBody">
        <SpecTagLabel text={hovered ? 'LIVE IN FIGMA' : 'REF — PROTOTYPE'} />
        <span className="detailFigmaSpecMain">
          The working file <span className="detailFigmaSpecArrow">→</span>
        </span>
      </span>
    </a>
  )
}

// Flip perspektif untuk label spec-tag — reuse pola FlipCaption/FlipCounter.
function SpecTagLabel({ text }) {
  const [displayText, setDisplayText] = useState(text)
  const [flipping, setFlipping] = useState(false)
  const prevText = useRef(text)

  useEffect(() => {
    if (text === prevText.current) return
    setFlipping(true)
    const t1 = setTimeout(() => setDisplayText(text), 150)
    const t2 = setTimeout(() => setFlipping(false), 300)
    prevText.current = text
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [text])

  return (
    <span className="detailFigmaSpecLabelWrap">
      <span className={`detailFigmaSpecLabel ${flipping ? 'is-flipping' : ''}`}>
        {displayText}
      </span>
    </span>
  )
}

function ProjectSection({ section, index }) {
  const [ref, inView] = useInView()
  const countLabel = String(index + 1).padStart(2, '0')

  const isPair = section.layout === 'pair'
  const isLongImage = section.layout === 'long-image-two-col-text'
  const isSlider = !isPair && !isLongImage

  const descLeft =
    section.twoColText?.left ?? section.description ?? `DESCRIPTION_LEFT_${index + 1}`
  const descRight = section.twoColText?.right ?? `DESCRIPTION_RIGHT_${index + 1}`
  const note = section.note ?? `NOTE_SECTION_${index + 1}`

  const total = isSlider ? section.images.length : 0
  const [slideIndex, setSlideIndex] = useState(0)
  const [direction, setDirection] = useState(null)
  const [outgoing, setOutgoing] = useState(null)

  const goNext = () => {
    if (total <= 1) return
    setDirection('next')
    setOutgoing({ ...section.images[slideIndex], dir: 'next' })
    setSlideIndex((i) => (i + 1) % total)
  }

  const goPrev = () => {
    if (total <= 1) return
    setDirection('prev')
    setOutgoing({ ...section.images[slideIndex], dir: 'prev' })
    setSlideIndex((i) => (i - 1 + total) % total)
  }

  const current = isSlider ? section.images[slideIndex] : null

  return (
    <div ref={ref} className={`editorialSection reveal ${inView ? 'inView' : ''}`}>
      <span className="editorialSectionCount">{countLabel}</span>

      <div className="editorialSectionRow">
        <div className="editorialMedia">
          {isSlider && (
            <SliderMedia
              images={section.images}
              slideIndex={slideIndex}
              direction={direction}
              outgoing={outgoing}
              onOutgoingDone={() => setOutgoing(null)}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          )}

          {isPair && (
            <PairGallery
              images={section.images}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          )}

          {isLongImage && (
            <LongImage
              image={section.image}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          )}
        </div>

        {isSlider && (
          <div className="editorialRail">
            <SliderRailMeta
              caption={current?.caption}
              index={slideIndex}
              total={total}
              note={note}
              onNext={goNext}
              onPrev={goPrev}
              inView={inView}
            />
          </div>
        )}

        <div className="editorialTextRow">
          <div className="editorialCol">
            <h3 className="editorialSectionTitle">{section.title}</h3>
            <p className="editorialDescText">{descLeft}</p>
          </div>
          <div className="editorialCol">
            <p className="editorialDescText">{descRight}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderMedia({
  images,
  slideIndex,
  direction,
  outgoing,
  onOutgoingDone,
  title,
  aspectRatio,
  active,
}) {
  const hasAspectRatio = Boolean(aspectRatio)
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const [naturalHeight, setNaturalHeight] = useState(null)

  const measureHeight = useCallback(() => {
    const img = imgRef.current
    const frame = frameRef.current
    if (!img || !frame || !img.naturalWidth) return
    const w = frame.offsetWidth
    setNaturalHeight((img.naturalHeight / img.naturalWidth) * w)
  }, [])

  useEffect(() => {
    if (hasAspectRatio) return
    if (imgRef.current?.complete) measureHeight()
  }, [slideIndex, hasAspectRatio, measureHeight])

  useEffect(() => {
    if (hasAspectRatio) return
    window.addEventListener('resize', measureHeight)
    return () => window.removeEventListener('resize', measureHeight)
  }, [hasAspectRatio, measureHeight])

  const current = images[slideIndex]
  const revealClass = direction ? `slide-in-${direction}` : active ? 'fade-in' : ''
  const naturalClass = hasAspectRatio ? '' : 'detailSliderImage--natural'

  return (
    <div className="detailSlider">
      <div
        ref={frameRef}
        className={`detailSliderFrame ${active ? 'is-active' : ''} ${
          hasAspectRatio ? '' : 'detailSliderFrame--natural'
        }`}
        style={
          hasAspectRatio
            ? { aspectRatio }
            : naturalHeight
            ? { height: naturalHeight }
            : undefined
        }
      >
        <div className="detailSliderPreload" aria-hidden="true">
          {images.map((img) => (
            <img key={`preload-${img.src}`} src={img.src} alt="" loading="eager" />
          ))}
        </div>

        {outgoing && (
          <img
            key={`out-${outgoing.src}-${outgoing.dir}`}
            className={`detailSliderImage is-outgoing slide-out-${outgoing.dir} ${naturalClass}`}
            src={outgoing.src}
            alt=""
            aria-hidden="true"
            onAnimationEnd={onOutgoingDone}
          />
        )}

        <img
          ref={imgRef}
          key={`cur-${current.src}-${slideIndex}`}
          className={`detailSliderImage is-current ${revealClass} ${naturalClass}`}
          src={current.src}
          alt={current.caption || `${title} — ${slideIndex + 1}`}
          onLoad={measureHeight}
        />
      </div>
    </div>
  )
}

function SliderRailMeta({ caption, index, total, note, onNext, onPrev, inView }) {
  return (
    <div className="railSliderMeta">
      {total > 1 && (
        <div className="railControls">
          <button
            type="button"
            className="detailSliderArrow detailSliderArrow--prev"
            onClick={onPrev}
            aria-label="Gambar sebelumnya"
          >
            ←
          </button>

          <FlipCounter current={index + 1} total={total} />

          <button
            type="button"
            className="detailSliderArrow detailSliderArrow--next"
            onClick={onNext}
            aria-label="Gambar selanjutnya"
          >
            →
          </button>
        </div>
      )}

      <FlipCaption text={caption} />

      <p className={`railNote reveal ${inView ? 'inView' : ''}`}>{note}</p>
    </div>
  )
}

function FlipCaption({ text }) {
  const [displayText, setDisplayText] = useState(text)
  const [flipping, setFlipping] = useState(false)
  const prevText = useRef(text)

  useEffect(() => {
    if (text === prevText.current) return
    setFlipping(true)
    const t1 = setTimeout(() => setDisplayText(text), 200)
    const t2 = setTimeout(() => setFlipping(false), 400)
    prevText.current = text
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [text])

  if (!displayText) return null

  return (
    <span className="detailSliderCaptionWrap">
      <span className={`detailSliderCaption ${flipping ? 'is-flipping' : ''}`}>
        {displayText}
      </span>
    </span>
  )
}

function FlipCounter({ current, total }) {
  const [displayCurrent, setDisplayCurrent] = useState(current)
  const [flipping, setFlipping] = useState(false)
  const prevCurrent = useRef(current)

  useEffect(() => {
    if (current === prevCurrent.current) return
    setFlipping(true)
    const t1 = setTimeout(() => setDisplayCurrent(current), 150)
    const t2 = setTimeout(() => setFlipping(false), 300)
    prevCurrent.current = current
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [current])

  return (
    <span className={`detailSliderCount ${flipping ? 'is-flipping' : ''}`}>
      {displayCurrent} / {total}
    </span>
  )
}

function PairGallery({ images, title, aspectRatio, active }) {
  return (
    <div className="detailPair">
      {images.map((img, i) => (
        <div key={img.src} className="detailPairItem">
          <div
            className={`detailPairFrame ${active ? 'is-active' : ''}`}
            style={{ aspectRatio }}
          >
            <img
              className="detailPairImage"
              src={img.src}
              alt={img.caption || `${title} — ${i + 1}`}
            />
          </div>

          {img.caption && <p className="detailPairCaption">{img.caption}</p>}
        </div>
      ))}
    </div>
  )
}

function LongImage({ image, title, aspectRatio, active }) {
  return (
    <div className="longImageWrap">
      <div
        className={`longImageFrame ${active ? 'is-active' : ''}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          className="longImageImg"
          src={image.src}
          alt={image.caption || title}
        />
      </div>

      {image.caption && <p className="longImageCaption">{image.caption}</p>}
    </div>
  )
}

export default ProjectDetail