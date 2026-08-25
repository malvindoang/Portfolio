import { useEffect, useRef, useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import Corners from '../components/Corners'
import { PROJECT_CONTENT } from '../data/projectContent'
import { SECTIONS } from '../data/projects'
import { useInView } from '../hooks/useInView'
import './ProjectDetail.css'

// Semua project sesuai urutan tampil di Home (punya slug atau belum) —
// dipakai supaya "next project" SELALU ada seperti referensi (vanholtz).
const ALL_PROJECTS = SECTIONS.flatMap((s) => s.projects)

// Layout zigzag kiri-kanan-kiri-kanan.
// 'left'  = teks di kiri, gambar di kanan
// 'right' = gambar di kiri, teks di kanan (section 4 WAJIB ini)
const PLACEMENT_BY_INDEX = ['left', 'right', 'left', 'right']

function ProjectDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const content = PROJECT_CONTENT[slug]
  const heroRef = useRef(null)
  const footerRef = useRef(null)

  // Tema per project (field `theme` di projects.js) — default 'red' bila
  // project belum punya tema sendiri. Home (tanpa class tema) tetap merah.
  const ownerProject = ALL_PROJECTS.find((p) => p.slug === slug)
  const projectTheme = ownerProject?.theme || 'red'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  // Background terang + corner hitam hanya di halaman project, plus class
  // tema (theme-<nama>) supaya About & elemen lain bisa di-scope per tema.
  useEffect(() => {
    document.body.classList.add('page-project', `theme-${projectTheme}`)
    return () => {
      document.body.classList.remove('page-project', `theme-${projectTheme}`)
    }
  }, [projectTheme])

  // Corner ATAS putih saat hero gelap mengapit zona corner;
  // corner BAWAH putih saat zona footer hitam mencapai corner bawah;
  // MALVIN (wordmark bawah) disembunyikan selama hero masih menutupinya.
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight

      const r = heroRef.current?.getBoundingClientRect()
      const overHero = r ? r.top < 90 && r.bottom > 90 : false
      document.body.classList.toggle('on-hero', overHero)

      // 118 = jarak wordmark dari dasar layar saat idle (rule nav--closed)
      const heroCoversWordmark = r ? r.bottom > vh - 118 : false
      document.body.classList.toggle('wordmark-hidden', heroCoversWordmark)

      const f = footerRef.current?.getBoundingClientRect()
      const overFooter = f ? f.top < vh - 110 : false
      document.body.classList.toggle('on-footer', overFooter)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
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

  // Hero PUNYA field sendiri (content.hero) — tidak lagi bergantung ke
  // sections[0], karena skema sections sekarang pakai "images" (array).
  const heroImage = content.hero

  // Corner kanan-atas: section nav seperti Home;
  // yang bold & bisa diklik = section yang memiliki project ini,
  // section lain diberi coretan & tidak bisa diklik (lihat Corners.jsx)
  const sectionNav = SECTIONS.map((section) => ({
    label: section.label.includes('—')
      ? section.label.split('—')[1].trim()
      : section.label,
    active: section.projects.some((p) => p.slug === slug),
    onClick: () => navigate('/'),
  }))

  return (
    <>
      <Corners sectionNav={sectionNav} />

      <article className="detail">
        {heroImage && (
          <section ref={heroRef} className="detailHero">
            <img
              className="detailHeroImage"
              src={heroImage}
              alt={content.title}
            />

            <div className="detailHeroOverlay" aria-hidden="true" />

            <h1 className="detailHeroTitle">{content.title}</h1>
          </section>
        )}

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

          {/* ROLE + TOOLS + YEAR + DURATION + TEAM — tidak diubah */}
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

        {/* Figma pill — sekarang berdiri sendiri di bawah section terakhir */}
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

// ================= BODY SECTION (slider / pair, zigzag) =================

function ProjectSection({ section, index }) {
  const [ref, inView] = useInView()
  const placement = PLACEMENT_BY_INDEX[index] || 'left'
  const isPair = section.layout === 'pair'

  return (
    <div
      ref={ref}
      className={`detailSection detailSection--${placement} ${
        isPair ? 'detailSection--pair' : 'detailSection--slider'
      } reveal ${inView ? 'inView' : ''}`}
    >
      <span className="detailSectionCount">
        {String(index + 1).padStart(2, '0')}
      </span>

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
          <p className="detailSectionText">{section.description}</p>
        </div>
      </div>
    </div>
  )
}

// images: [{ src, caption }] — caption dipakai juga sebagai alt text.
function SliderGallery({ images, title, aspectRatio, active }) {
  const [index, setIndex] = useState(0)
  const total = images.length
  const current = images[index]

  const goNext = () => setIndex((i) => (i + 1) % total)
  const goPrev = () => setIndex((i) => (i - 1 + total) % total)

  return (
    <div className="detailSlider">
      <div
        className={`detailSliderFrame ${active ? 'is-active' : ''}`}
        style={{ aspectRatio }}
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

// images: [{ src, caption }] — caption dipakai juga sebagai alt text.
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

export default ProjectDetail