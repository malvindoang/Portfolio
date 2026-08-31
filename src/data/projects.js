export const SECTIONS = [
  {
    label: '01 — UI/UX',
    projects: [
      { title: 'HUB PKP', year: 2026, slug: 'hub-pkp', theme: 'mono' },
      { title: 'GARBAGE CLASSIFICATION', year: 2026 },
      { title: 'CALM', year: 2025 },
      { title: 'PLANET HEROES', year: 2024 },
      { title: 'PURE PLATES', year: 2024 },
    ],
  },
  {
    label: '02 — WEB DEVELOPMENT',
    projects: [
      { title: 'GARBAGE CLASSIFICATION', year: 2026 },
    ],
  },
  {
    label: '03 — RESEARCH',
    projects: [
      { title: 'EDGE-AI RESEARCH', year: 2026 },
      { title: 'UI/UX TRENDS', year: 2024 },
    ],
  },
]

export const DETAIL_ORDER = ['hub-pkp']

// Dipakai Home.jsx & ProjectDetail.jsx untuk membangun sectionNav —
// label penuh ("01 — UI/UX") dipendekkan jadi bagian setelah em-dash
// ("UI/UX") kalau ada; kalau tidak ada em-dash, label dipakai apa adanya.
export function getSectionShortLabel(label) {
  return label.includes('—') ? label.split('—')[1].trim() : label
}