import { useEffect, useRef, useState } from 'react'
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
  const footerRef = useRef(null)

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

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight

      const r = heroRef.current?.getBoundingClientRect()
      const overHero = r ? r.top < 90 && r.bottom > 90 : false
      document.body.classList.toggle('on-hero', overHero)

      const heroCoversWordmark = r ? r.bottom > vh - 118 : false
      document.body.classList.toggle('wordmark-hidden', heroCoversWordmark)

      const f = footerRef.current?.getBoundingClientRect()
      const overFooter = f ? f.top < vh - 110 : false
      document.body.classList.toggle('on-footer', overFooter)
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
      document.body.classList.remove('on-footer')
      document.body.classList.remove('wordmark-hidden')
    }
  }, [])

  const [introRef, introInView] = useInView()
  const [figmaRef, figmaInView] = useInView()
  const [closingRef, closingInView] = useInView()

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
          <Link ref={footerRef} to={nextTo} className="detailNext">
            <div className="detailNextInner">
              <span className="detailNextLabel">Next project</span>
              <span className="detailNextTitle">{nextProject.title}</span>
            </div>
          </Link>
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
  // section 02): frame beralih ke mode "natural" — height:auto, gambar
  // ikut alur normal (bukan position:absolute) supaya tinggi mengikuti
  // rasio asli foto dan tidak ter-crop. HUB PKP selalu kirim aspectRatio,
  // jadi tetap lewat jalur lama (position:absolute + object-fit:cover),
  // TIDAK terpengaruh sama sekali.
  const hasAspectRatio = Boolean(aspectRatio)

  const goNext = () => setIndex((i) => (i + 1) % total)
  const goPrev = () => setIndex((i) => (i - 1 + total) % total)

  return (
    <div className="detailSlider">
      <div
        className={`detailSliderFrame ${active ? 'is-active' : ''} ${
          hasAspectRatio ? '' : 'detailSliderFrame--natural'
        }`}
        style={hasAspectRatio ? { aspectRatio } : undefined}
      >
        <img
          key={index}
          className="detailSliderImage"
          src={current.src}
          alt={current.caption || `${title} — ${index + 1}`}
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