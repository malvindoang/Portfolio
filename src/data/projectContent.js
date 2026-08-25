export const PROJECT_CONTENT = {
  'hub-pkp': {
    title: 'Hub PKP',
    role: 'UI/UX Designer & Website Designer',
    tools: 'Figma',
    year: 2026,
    duration: '6 months',
    team: '11 people',
    // Figma pill sekarang tampil sebagai elemen tunggal di bawah section
    // terakhir (bukan lagi menempel di satu section tertentu).
    figma: true,
    // Gambar hero — terpisah dari sections (sections dipakai untuk body).
    // Ganti path ini kalau file landing-page.png kamu ada di lokasi lain.
    hero: '/images/hub-pkp/landing-page.png',
    intro:
      "In Indonesia, more than 8 out of 10 homes are built by the people themselves — often without professional guidance, transparent pricing, or anyone to hold accountable. HUB Layanan Rumah Swadaya Layak Huni is the Ministry of Housing and Settlement Areas (PKP)'s digital answer to that reality.",
    approach:
      'During my six-month internship as a UI/UX intern, I helped design this hub to support the national livable-housing program (Program 3 Juta Rumah). It gathers citizens, contractors, daily workers, material vendors, and government offices (Balai) into one ecosystem — where each role walks its own path and sees only what matters to them, on web and mobile.',
    sections: [
      {
        title: 'One platform, four perspectives',
        description:
          "One system, four very different pairs of eyes: a family searching for trustworthy workers, a contractor waiting for jobs, a daily worker hoping to be hired, and a government office accountable for them all. If any of them sees too much — or too little — the platform fails. So I designed the same hub four times, once per role, until every person meets only what matters to them. The slides walk through the citizen's view, the contractor's view, and the government's view.",
        images: [
          {
            src: '/images/hub-pkp/1a.png',
            caption: "The citizen's view — finding workers nearby",
          },
          {
            src: '/images/hub-pkp/1b.png',
            caption: "The contractor's view — receiving job requests",
          },
          {
            src: '/images/hub-pkp/1c.png',
            caption: "The government's view — verifying workers",
          },
        ],
        layout: 'slider',
        aspectRatio: '480 / 371',
      },
      {
        title: 'From finding a worker to knowing exactly what you pay',
        description:
          "Hiring someone to build your home used to be a leap of faith — a name from a neighbor, a price agreed verbally, and hope. I designed this journey to replace hope with clarity: first you see who works near you. Then the contractors you shortlist prepare a detailed cost plan (RAB) for your project — labor, materials, and equipment itemized line by line — so a verbal price becomes something you can read, compare, and question. Then you agree in writing, and only then you pay, step by step, watching the work as it happens. Every screen here answers one quiet question in the user's mind: 'can I trust this person with my home?'",
        images: [
          {
            src: '/images/hub-pkp/2a.png',
            caption: 'Seeing who works near you',
          },
          {
            src: '/images/hub-pkp/2b.png',
            caption: 'Reading the price, line by line',
          },
          {
            src: '/images/hub-pkp/2c.png',
            caption: 'Agreeing in writing, paying step by step',
          },
        ],
        layout: 'slider',
        aspectRatio: '360 / 301',
      },
      {
        title: 'An open door for citizens, a control room for the government',
        description:
          "A public service shouldn't end at the screen. Some citizens still want to sit across a table and ask — so the Balai landing page acts as an open door: a distribution map that leads people to their nearest office, and offline consultation they can actually attend. On the other side of the same coin, the monitoring dashboard acts as a control room, where internal staff see app usage, project activity, and administration in one place — because a national program stays trustworthy only when someone can see the whole picture.",
        images: [
          {
            src: '/images/hub-pkp/3a.png',
            caption: 'The open door — leading citizens to the nearest Balai',
          },
          {
            src: '/images/hub-pkp/3b.png',
            caption: 'The control room — seeing the whole service',
          },
        ],
        layout: 'slider',
        aspectRatio: '144 / 151',
      },
      {
        title: 'The same hub, in your pocket',
        description:
          "The people who need this hub the most are rarely in front of a desktop — they're standing on a construction site, phone in hand. So the final chapter was redesigning its most essential journey for mobile: finding a contractor on a map and getting to know them through their profile. Not a shrunken website, but a rethought experience — simpler hierarchy, comfortable touch targets, and answers that arrive quickly, because under the sun on a small screen, every bit of clarity matters.",
        images: [
          {
            src: '/images/hub-pkp/4a.png',
            caption: 'Searching on the go',
          },
          {
            src: '/images/hub-pkp/4b.png',
            caption: 'Found — getting to know them',
          },
        ],
        layout: 'pair',
        aspectRatio: '439 / 891',
      },
    ],
    closing:
      'This project taught me that designing for government is, at its core, designing for trust — between citizens and workers, and between people and their government. It was a valuable experience in shaping a complex, multi-role system, and in seeing firsthand how thoughtful digital design can support a national-scale program.',
  },
}