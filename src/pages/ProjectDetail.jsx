import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Corners from '../components/Corners'
import { PROJECT_CONTENT } from '../data/projectContent'
import { SECTIONS } from '../data/projects'
import { useInView } from '../hooks/useInView'
import './ProjectDetail.css'

const ALL_PROJECTS = SECTIONS.flatMap((s) => s.projects)

const PLACEMENT_BY_INDEX = ['left', 'right', 'left', 'right']

function ProjectDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const content = PROJECT_CONTENT[slug]
  const heroRef = useRef(null)
  const nextRef = useRef(null)

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
  const [figmaRef, figmaInView] = useInView()
  const [closingRef, closingInView] = useInView()

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight

      const r = heroRef.current?.getBoundingClientRect()
      const overHero = r ? r.top < 90 && r.bottom > 90 : false
      document.body.classList.toggle('on-hero', overHero)

      const heroCoversWordmark = r ? r.bottom > vh - 118 : false
      document.body.classList.toggle('wordmark-hidden', heroCoversWordmark)

      // ==== READING MODE (State B/C) ====
      // B aktif: garis bawah section opening (intro) sudah lewat slot
      // wordmark idle (vh - 118, KNOB sama dengan threshold wordmark-hidden
      // di atas). C: balik ke A begitu elemen NEXT PROJECT masuk viewport
      // (dipindah dari closing paragraph — requirement 2).
      // closingRef TETAP dipakai untuk reveal animation paragraf closing
      // (lihat closingInView di bawah), hanya dilepas dari logic ini.
      // Fallback ke closingRect kalau next project tidak dirender (mis.
      // cuma ada 1 project) — supaya reading-mode tidak nyangkut permanen.
      const introRect = introRef.current?.getBoundingClientRect()
      const nextRect = nextRef.current?.getBoundingClientRect()
      const closingRect = closingRef.current?.getBoundingClientRect()
      const pastIntro = introRect ? introRect.bottom < vh - 118 : false
      const reachedNext = nextRect
        ? nextRect.top < vh
        : closingRect
        ? closingRect.top < vh
        : false
      document.body.classList.toggle('reading-mode', pastIntro && !reachedNext)
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
      document.body.classList.remove('reading-mode') // cleanup saat unmount
    }
  }, [])

  if (!content) return <Navigate to="/" replace />

  const currentIndex = ALL_PROJECTS.findIndex((p) => p.slug === slug)
  const nextProject = ALL_PROJECTS[(currentIndex + 1) % ALL_PROJECTS.length]
  const nextTo = nextProject?.slug ? `/project/${nextProject.slug}` : '/'

  const heroImage = content.hero

  return (
    <>
      {/* sectionNav (01/02/03) DIHAPUS khusus halaman project — diganti
          tombol back (←) via prop onBack. Home.jsx TIDAK terpengaruh. */}
      <Corners onBack={() => navigate('/')} />

      <article className="detail">
        {/* HERO SELALU DIRENDER: kotak #1e1e1e + judul besar, persis HUB PKP.
            Gambar OPSIONAL — nanti tinggal isi content.hero di
            projectContent.js, <img> + overlay otomatis ikut muncul. */}
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

        <section ref={introRef} className="detailIntro">
          <div
            className={`detailIntroCol detailIntroHeading reveal ${
              introInView ? 'inView' : ''
            }`}
          >
            {content.intro}
          </div>

          <div
            className={`detailIntroCol detailIntroBody reveal ${
              introInView ? 'inView' : ''
            }`}
          >
            {content.approach}
          </div>

          <div
            className={`detailIntroCol detailIntroSidebar reveal ${
              introInView ? 'inView' : ''
            }`}
          >
            <div>
              <span className="detailCreditsLabel">Role</span>
              {content.role}
            </div>

            <div>
              <span className="detailCreditsLabel">Tools</span>
              {content.tools}
            </div>

            <div>
              <span className="detailCreditsLabel">Year</span>
              {content.year}
            </div>

            <div>
              <span className="detailCreditsLabel">Duration</span>
              {content.duration}
            </div>

            <div>
              <span className="detailCreditsLabel">Team</span>
              {content.team}
            </div>
          </div>
        </section>

        {content.sections.map((section, index) => (
          <ProjectSection
            key={section.title}
            section={section}
            index={index}
          />
        ))}

        {content.figma && (
          <div
            ref={figmaRef}
            className={`detailFigmaWrap reveal ${
              figmaInView ? 'inView' : ''
            }`}
          >
            <a href="#" className="detailFigmaPill">
              View Figma prototype →
            </a>
          </div>
        )}

        <section ref={closingRef} className="detailClosing">
          <p
            className={`detailParagraph detailClosingText reveal ${
              closingInView ? 'inView' : ''
            }`}
          >
            {content.closing}
          </p>
        </section>

        {nextProject && nextProject.title !== content.title && (
          <div ref={nextRef} className="detailNextSection">
            <span className="detailNextLabel">Next project</span>
            <Link to={nextTo} className="detailNextPerspective">
              <span className="detailNextTitle">{nextProject.title}</span>
            </Link>
          </div>
        )}
      </article>
    </>
  )
}

function ProjectSection({ section, index }) {
  const [ref, inView] = useInView()
  const placement = PLACEMENT_BY_INDEX[index] || 'left'
  const countLabel = String(index + 1).padStart(2, '0')

  // ---- Layout: long-image-two-col-text ----
  if (section.layout === 'long-image-two-col-text') {
    return (
      <div
        ref={ref}
        className={`detailSection detailSection--longimage reveal ${
          inView ? 'inView' : ''
        }`}
      >
        <span className="detailSectionCount">{countLabel}</span>

        <div className="detailSectionRow">
          <div className="detailSectionMedia">
            <LongImage
              image={section.image}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          </div>

          <div className="detailSectionSide detailSectionSide--sticky">
            <h3 className="detailSectionTitle">{section.title}</h3>

            <div className="longImageTextStack">
              <p className="longImageTextBlock">
                {section.twoColText.left}
              </p>
              <p className="longImageTextBlock">
                {section.twoColText.right}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- Layout existing: slider / pair (persis pola HUB PKP) ----
  const isPair = section.layout === 'pair'

  return (
    <div
      ref={ref}
      className={`detailSection detailSection--${placement} ${
        isPair ? 'detailSection--pair' : 'detailSection--slider'
      } reveal ${inView ? 'inView' : ''}`}
    >
      <span className="detailSectionCount">{countLabel}</span>

      <div className="detailSectionRow">
        <div className="detailSectionMedia">
          {isPair ? (
            <PairGallery
              images={section.images}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          ) : (
            <SliderGallery
              images={section.images}
              title={section.title}
              aspectRatio={section.aspectRatio}
              active={inView}
            />
          )}
        </div>

        <div className={`detailSectionSide detailSectionSide--${placement}`}>
          <h3 className="detailSectionTitle">{section.title}</h3>
          {section.description && (
            <p className="detailSectionText">{section.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SliderGallery({ images, title, aspectRatio, active }) {
  const [index, setIndex] = useState(0)
  const total = images.length
  const current = images[index]

  // Kalau section TIDAK mengirim aspectRatio (mis. Garbage Classification
  // section 02): frame beralih ke mode "natural" — tinggi frame dihitung
  // manual dari rasio asli gambar (bukan CSS height:auto polos), supaya
  // transisi tinggi antar-slide bisa di-animasikan halus (requirement 4).
  // HUB PKP selalu kirim aspectRatio, tetap lewat jalur lama, TIDAK
  // terpengaruh sama sekali.
  const hasAspectRatio = Boolean(aspectRatio)

  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const [naturalHeight, setNaturalHeight] = useState(null)

  // Hitung tinggi frame dari rasio natural gambar x lebar frame saat ini.
  const measureHeight = useCallback(() => {
    const img = imgRef.current
    const frame = frameRef.current
    if (!img || !frame || !img.naturalWidth) return
    const w = frame.offsetWidth
    setNaturalHeight((img.naturalHeight / img.naturalWidth) * w)
  }, [])

  // Kalau gambar sudah ada di cache browser, event onLoad TIDAK pernah
  // fire (img.complete langsung true saat mount), jadi dicek manual
  // tiap ganti slide.
  useEffect(() => {
    if (hasAspectRatio) return
    if (imgRef.current?.complete) measureHeight()
  }, [index, hasAspectRatio, measureHeight])

  // Recompute saat window resize (lebar frame berubah → tinggi
  // proporsional ikut berubah).
  useEffect(() => {
    if (hasAspectRatio) return
    window.addEventListener('resize', measureHeight)
    return () => window.removeEventListener('resize', measureHeight)
  }, [hasAspectRatio, measureHeight])

  const goNext = () => setIndex((i) => (i + 1) % total)
  const goPrev = () => setIndex((i) => (i - 1 + total) % total)

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
        <img
          ref={imgRef}
          key={index}
          className="detailSliderImage"
          src={current.src}
          alt={current.caption || `${title} — ${index + 1}`}
          onLoad={measureHeight}
        />
      </div>

      <div className="detailSliderMeta">
        {current.caption && (
          <span className="detailSliderCaption">{current.caption}</span>
        )}

        {total > 1 && (
          <div className="detailSliderControls">
            <button
              type="button"
              className="detailSliderArrow detailSliderArrow--prev"
              onClick={goPrev}
              aria-label="Gambar sebelumnya"
            >
              ←
            </button>

            <span className="detailSliderCount">
              {index + 1} / {total}
            </span>

            <button
              type="button"
              className="detailSliderArrow detailSliderArrow--next"
              onClick={goNext}
              aria-label="Gambar selanjutnya"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
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

          {img.caption && (
            <p className="detailPairCaption">{img.caption}</p>
          )}
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