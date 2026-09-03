export const PROJECT_CONTENT = {
  'hub-pkp': {
    title: 'Hub PKP',
    role: 'UI/UX Designer & Website Designer',
    tools: 'Figma',
    year: 2026,
    duration: '6 months',
    team: '11 people',
    figma: true,
    figmaUrl: '', // TODO: isi link Figma prototype di sini (string URL)
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

  'garbage-classification': {
    title: 'Garbage Classification',
    role: 'UI/UX Designer & Website Designer',
    tools: 'Figma, Photoshop',
    year: 2026,
    duration: '5 days',
    team: 'Individual',
    figma: true, // pill "View Figma prototype" tampil (persis HUB PKP)
    figmaUrl: '', // TODO: isi link Figma prototype di sini (string URL)
    hero: null,
    // Judul hero dipecah 2 baris: baris terakhir tetap flush kanan
    // (posisi tidak berubah), baris atas diberi padding kanan via CSS.
    heroLines: ['Garbage', 'Classification'],
    intro:
      'An accurate model is useless if nobody can use it. Garbage Classification is the interface I designed for my undergraduate thesis — a machine-learning model that recognizes six types of waste from a single photo — built so that anyone, not just researchers, can sort waste correctly in seconds.',
    approach:
      'In just five days, I prototyped the entire experience in Figma: a friendly, illustration-driven web app in Bahasa Indonesia that explains itself before asking anything. The prototype later became the blueprint for the deployed web application (Web Development section), while the model and the research paper live in the Research section.',
    sections: [
      {
        title: 'Explaining a model in everyday language',
        image: {
          src: '/images/garbage-classification/home.png',
          caption: 'Home page',
        },
        twoColText: {
          left:
            "The home page explains before it asks. In plain Bahasa Indonesia, with illustrations of waste bins, leaf-trucks, and clouds that feel more like a poster than a dashboard, it answers the only question a first-time visitor has — what is this tool, and why does it matter. The eco-green palette quietly signals what the project cares about, so anyone, from students to grandparents, feels the tool was made for them.",
          right:
            'Below the fold, the six categories the model understands are laid out plainly — cardboard, glass, metal, paper, plastic, and trash — just the everyday names people already use. Before asking anyone to upload a photo, the design shows exactly what the model can and cannot see, so users arrive at the next step already knowing the boundaries. That quiet confidence makes the first upload feel less like a test and more like a conversation.',
        },
        layout: 'long-image-two-col-text',
      },
      {
        title: 'One upload, one honest answer',
        description:
          'The three screens that follow are as light as the model itself. The detection page asks for a single photo with clear rules — JPG or PNG, maximum 10MB — so there is never any guesswork. Once uploaded, the screen quietly confirms what you picked — name, size, format, the moment it arrived — before the model looks at anything. Then comes the honest answer: the label it chose, the confidence behind it, and the alternatives it considered. No oracle, no black box — just a voice that estimates openly, so people can judge for themselves.',
        images: [
          {
            src: '/images/garbage-classification/detection.png',
            caption: 'Detection: one photo, clear rules',
          },
          {
            src: '/images/garbage-classification/after-upload.png',
            caption: 'Confirm before the model looks',
          },
          {
            src: '/images/garbage-classification/result.png',
            caption: 'An honest answer: label, confidence, alternatives',
          },
        ],
        layout: 'slider',
        // aspectRatio SENGAJA dihapus — gambar detection/after-upload/result
        // punya rasio native berbeda-beda, tidak boleh dipaksa crop.
        // Frame otomatis pakai height:auto via .detailSliderFrame--natural
        // (lihat SliderGallery di ProjectDetail.jsx + ProjectDetail.css).
      },
    ],
    closing:
      'Five days of prototyping taught me that the hardest part of designing for machine learning is not the screens — it is translating a model\'s output into something people can understand and trust. This prototype became the blueprint for the deployed web application, and together with the model and the research paper, it completes the three outputs of my thesis.',
  },
}