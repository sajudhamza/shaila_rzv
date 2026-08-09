import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CMS_DIR = path.join(ROOT, 'public', 'cms-projects')
const PROJECTS_FILE = path.join(CMS_DIR, 'projects.json')
const REMOVED_FILE = path.join(CMS_DIR, 'removed.json')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const tokens = new Map()

/** Seeded studio projects (folders + home/case study cards). */
const SEED_PROJECTS = [
  {
    id: 'bungalow',
    slug: 'bungalow',
    name: 'Bungalow',
    summary:
      "Bungalow in NYC's East Village: A luxe retreat inspired by vintage Indian living, meticulously crafted.",
    description:
      'Located in the East Village of New York City, Bungalow transports guests to the opulence of vintage Indian upscale living. Inspired by British-era buildings in India, it embodies the essence of luxury associated with bungalows, once homes to eminent individuals and social clubs. Despite facing challenges of a cellar space with low ceilings, the design meticulously crafted an ambiance reminiscent of a traditional bungalow. As guests step through the entrance, they are greeted by a striking mural at the host station, setting the tone for the luxurious experience that awaits. The Library & Bar lounge beckons with its inviting atmosphere, while the Dining area offers a feast for the senses with its unique design elements. Booth seating resembling balconies and a serene skylight area further immerse guests in an outdoor garden/verandah feel. The interior design narrative is woven with jewel tone colors like amber, emerald, and ruby, combined with soft pastel shades commonly found in old Indian architectures. Each hue and tactile element, carefully custom-made in brass, glass, and wood, enriches the guest experience with layers of cultural depth and visual allure. Every detail is carefully considered, from the custom-made furniture, decor pieces, and lighting fixtures meticulously crafted in Delhi, Jaipur, and Gurgaon, ensuring authenticity and quality. Unlike traditional softwood bentwood, bespoke wooden chairs are crafted from teak wood, adding a touch of sophistication to the space. All the oil paintings in the lounge area are hand-painted, and every illustration on the branding is hand-sketched to reflect the physical space accurately. Through virtual collaboration and regular video calls, every aspect of the design, from upholstery to wood finishes, was decided with precision and care. The customization of wall lights and chandeliers posed significant challenges, yet the team persevered, translating hand-drawn designs into exquisite brass fixtures with cut and frosted glass finishes, resulting in a truly breathtaking aesthetic. Bungalow is more than just a restaurant; it is an immersive experience curated to evoke a sense of home and leisure, where every detail reflects the nostalgia and charm of the bygone era.',
    legacyHref: '/desing-cms/bungalow/',
  },
  {
    id: 'chote-miya',
    slug: 'chote-miya',
    name: 'Chote Miya',
    summary:
      "Chote Miya: A vibrant tribute to 90's India, blending street flavors with nostalgic ambiance in NYC.",
    description:
      "Chote Miya is a vibrant ode to the streets of India. The space, formerly a meat store, undergoes a remarkable transformation. Our approach unfolds with a nostalgic glance back to 90s India, a time of thriving local brands and tantalizing street treats. The space layout is designed to accommodate a large kitchen, a front cash and food dispersal counter, a seating area, and a large display cabinet. A communal table beckons patrons to gather and savor the flavors of India amidst famous grocery items on display and Bollywood melodies, embracing an eclectic narrative steeped in nostalgia. Drawing inspiration from Bombay's Irani cafes and the vernacular of its bustling streets, the space is adorned with teak wood millwork and furniture. Vintage advertising posters on wall frames ignite a sense of homecoming for guests. Tube lights hang with modern simplicity, while iconic bentwood chairs and bespoke graphical artwork create a departure from convention, evoking a welcoming ambiance throughout. The color scheme mirrors the vibrancy of Indian streets, with the main signboard serving as an invitation to an Indian street. Inside, a towering wall mural adorned with matchbox art depicts the essence of Bombay life in vivid detail, from colorful taxis to iconic double-decker buses. Inspired by the whimsical quotes adorning Indian trucks and buses, the graphic design used in the space adds a playful touch. Quotations like tip top, free wi-fi, high class, and freshly made adorn the display cabinet top shelves and other areas, adding to the authenticity and charm. Chote Miya's design is a journey through the bustling streets of India, a celebration of culture, flavor, and community. For the bustling metropolis of New York, it is a cherished escape into a world of vibrant authenticity.",
    legacyHref: '/desing-cms/chote-miya/',
  },
  {
    id: 'gupshup',
    slug: 'gupshup',
    name: 'GupShup',
    summary:
      'GupShup (Bombay House) in NYC: 1970s Bombay nostalgia meets vibrant ambiance, blending Indian culture with creativity.',
    description:
      "GupShup is a nostalgic journey back to the 1970s Bombay-era Parsi home, reimagined in New York City. Nestled in Gramercy Park, GupShup exudes a captivating ambiance, adorned with intricate design elements such as charming light fixtures, jewel toned textiles, vibrant artwork, and a captivating display Dabba/tiffin wall. The design is a blend of talent from This is it Designs in Delhi and the creative prowess of Keith+Lead. Since its inception in 2018, our role has been integral to the brand, sourcing unique elements like enchanting bicycles, eye-catching mirrors, distressed wood sideboards, furniture and other decor from India. This role also involved orchestrating outdoor space, infusing special events with bespoke interior decorations, and rebranding GupShup's collaterals. The restaurant's retro charm allows for a diverse and eclectic narrative that resonates deeply with its patrons.",
    legacyHref: '/desing-cms/gupshup/',
  },
  {
    id: 'ammi',
    slug: 'ammi',
    name: 'Ammi',
    summary:
      'Ammi at Pier 57, NYC: Homestyle Indian cuisine, vibrant design, and open kitchen for immersive dining.',
    description:
      "Ammi, located within Pier 57 in New York, offers a delightful tribute to the comforting homestyle cuisine of India. Within the bustling food court of Market 57 Station, Ammi's kiosk space welcomes visitors with a charming design, adorned with marigold flowers and an inviting orange and green color scheme. Upon entering Ammi, guests are greeted by the uplifting sight of marigolds. The open cooking concept of Ammi demanded a functional and contemporary layout, meticulously designed to optimize efficiency in the cooking, cash, and food dispersal areas. The seamless integration of the kitchen space with the customer-facing areas allows patrons to witness the culinary craftsmanship firsthand. With its vibrant decor, fresh herb accents, and cozy home kitchen atmosphere, Ammi beckons guests to embark on a culinary voyage that celebrates the heartwarming flavors and traditions of Indian home cooking.",
    legacyHref: '/desing-cms/ammi/',
  },
  {
    id: 'movie',
    slug: 'movie',
    name: 'Zindagi Kashmakash',
    summary:
      "Zindagi Kashmakash set design crafted to match the film's narrative, era and style with visually compelling interiors.",
    description:
      "The set design for the film Zindagi Kashmakash was crafted to match the film's narrative, era, and style, ensuring the spaces were visually compelling and functional. The lead actor's room, set on a terrace, featured a boho, free-spirited style to reflect her creative and unconventional personality. In contrast, her sister, a doctor, had a space designed with muted tones and a minimalistic aesthetic, mirroring her disciplined and reserved nature. These design choices effectively conveyed each character's personality and lifestyle, enriching the narrative and deepening the audience's connection to the characters.",
    legacyHref: '/desing-cms/movie/',
  },
  {
    id: 'punjab-meet-house',
    slug: 'punjab-meet-house',
    name: 'Punjab Meet House',
    summary:
      'Punjab Meet House in Jersey City: an upscale casual dining room shaped around the warmth of a Punjabi home.',
    description:
      'Punjab Meet House sits on the ground floor of Haus25 at 25 Christopher Columbus Drive in Jersey City, spanning about 2,245 square feet near Exchange Place. Designed by Shaila Rizvi Studio, the upscale casual dining room was shaped to evoke the warmth and hospitality of a Punjabi home. The interior draws on the artistic heritage of the Indian subcontinent through handcrafted furnishings, decorative elements, and authentic imports from India. Warm materials, layered textures, carefully considered lighting, and distinctive architectural details create an environment that feels immersive without becoming theatrical. Vibrant color, Phulkari-inspired pattern, and soft lighting support an atmosphere of refined comfort for both table and bar seating, letting cultural influence come through thoughtfully rather than as ornament alone.',
    legacyHref: null,
  },
]

function getAdminPassword() {
  return process.env.SHAILA_ADMIN_PASSWORD || 'ShailaRizvi2026!'
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function isAuthed(req, body = {}) {
  const header = req.headers.authorization || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const token = bearer || body.token || ''
  if (!token) return false
  const meta = tokens.get(token)
  if (!meta) return false
  if (Date.now() > meta.expiresAt) {
    tokens.delete(token)
    return false
  }
  return true
}

function ensureCms() {
  fs.mkdirSync(CMS_DIR, { recursive: true })
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, '[]\n', 'utf8')
  }
}

function readProjectsRaw() {
  ensureCms()
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeProjects(projects) {
  ensureCms()
  fs.writeFileSync(PROJECTS_FILE, `${JSON.stringify(projects, null, 2)}\n`, 'utf8')
}

function readRemovedSlugs() {
  ensureCms()
  try {
    const data = JSON.parse(fs.readFileSync(REMOVED_FILE, 'utf8'))
    return new Set(Array.isArray(data) ? data.map(String) : [])
  } catch {
    return new Set()
  }
}

function writeRemovedSlugs(set) {
  ensureCms()
  fs.writeFileSync(REMOVED_FILE, `${JSON.stringify([...set], null, 2)}\n`, 'utf8')
}

function safeUnlinkUnder(dir, filename) {
  const base = path.basename(String(filename || ''))
  if (!base || base === '.' || base === '..') return false
  const full = path.join(dir, base)
  if (!full.startsWith(dir)) return false
  if (!fs.existsSync(full)) return false
  fs.unlinkSync(full)
  return true
}

function removeDirRecursive(dir) {
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true, force: true })
}

function slugify(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || `project-${Date.now()}`
  )
}

function uniqueSlug(base, projects) {
  let slug = base
  let n = 2
  while (projects.some((p) => p.slug === slug) || fs.existsSync(path.join(CMS_DIR, slug))) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}

function extensionFromMime(mime = '', fallback = '.jpg') {
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('gif')) return '.gif'
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'
  return fallback
}

function saveBase64Image(dataUrl, destPath) {
  const raw = String(dataUrl || '').replace(/^data:[^;]+;base64,/, '')
  const buffer = Buffer.from(raw, 'base64')
  if (!buffer.length) return false
  fs.writeFileSync(destPath, buffer)
  return true
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function listImagesInDir(dir, urlPrefix) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => `${urlPrefix}/${name}`)
}

function listJournalInDir(dir, urlPrefix) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => {
      const base = name.replace(/\.[^.]+$/, '')
      const captionFile = path.join(dir, `${base}.txt`)
      let caption = ''
      if (fs.existsSync(captionFile)) {
        caption = fs.readFileSync(captionFile, 'utf8').trim()
      }
      return { image: `${urlPrefix}/${name}`, caption }
    })
}

function ensureProjectFolders(slug) {
  const projectDir = path.join(CMS_DIR, slug)
  const imagesDir = path.join(projectDir, 'images')
  const journalDir = path.join(projectDir, 'journal')
  fs.mkdirSync(imagesDir, { recursive: true })
  fs.mkdirSync(journalDir, { recursive: true })
  const readme = path.join(projectDir, 'README.txt')
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      [
        `Project folder: ${slug}`,
        '',
        'Drop photos here:',
        '  images/   -> main project / case study gallery',
        '  journal/  -> journal images (optional matching .txt captions)',
        '',
        'Refresh the site (with npm run dev) to see updates.',
        '',
      ].join('\n'),
      'utf8',
    )
  }
  return { projectDir, imagesDir, journalDir }
}

function buildProjectPage(project) {
  const gallery = (project.images || [])
    .map(
      (src) => `
      <figure class="srp-figure">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(project.name)}" loading="lazy" />
      </figure>`,
    )
    .join('\n')

  const journal = (project.journal || [])
    .map(
      (entry, i) => `
      <article class="srp-journal-item">
        <div class="srp-journal-media">
          <img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.caption || project.name + ' journal ' + (i + 1))}" loading="lazy" />
        </div>
        ${
          entry.caption
            ? `<p class="srp-journal-caption">${escapeHtml(entry.caption)}</p>`
            : ''
        }
      </article>`,
    )
    .join('\n')

  const emptyHint = `
    <section class="srp-section">
      <p class="srp-lead">Add images to <code>public/cms-projects/${escapeHtml(project.slug)}/images/</code> and refresh.</p>
    </section>`

  const meta = escapeHtml((project.summary || project.description || '').slice(0, 160))
  const leadHtml = formatLeadHtml(project.description || project.summary || '')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} | Shaila Rizvi</title>
  <meta name="description" content="${meta}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/enhance/project-page.css" />
</head>
<body class="srp-body">
  <header class="srp-header">
    <a class="srp-brand" href="/">Shaila Rizvi</a>
    <nav class="srp-nav">
      <a href="/#case-studies">Case Studies</a>
      <a href="/">Home</a>
    </nav>
  </header>

  <main>
    <section class="srp-hero">
      <h1>${escapeHtml(project.name)}</h1>
      <div class="srp-lead">${leadHtml}</div>
    </section>

    ${
      gallery
        ? `<section class="srp-section">
      <h2>Project</h2>
      <div class="srp-gallery">${gallery}</div>
    </section>`
        : emptyHint
    }

    ${
      journal
        ? `<section class="srp-section srp-journal">
      <h2>Journal</h2>
      <div class="srp-journal-grid">${journal}</div>
    </section>`
        : ''
    }
  </main>

  <footer class="srp-footer">
    <a href="/">Back to Shaila Rizvi</a>
  </footer>
  <script src="/enhance/admin.js" defer></script>
</body>
</html>
`
}

function formatLeadHtml(text = '') {
  const cleaned = String(text).replace(/\u200d/g, '').trim()
  if (!cleaned) return ''
  // Keep full case-study copy readable as paragraphs on the detail page.
  const parts = cleaned
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean)
  const chunks = []
  let buf = ''
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part
    if (buf.length >= 320) {
      chunks.push(buf)
      buf = ''
    }
  }
  if (buf) chunks.push(buf)
  return (chunks.length ? chunks : [cleaned])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n      ')
}

function mergeSeedProjects(existing) {
  const removed = readRemovedSlugs()
  const bySlug = new Map()
  existing.forEach((p) => {
    if (p?.slug) bySlug.set(p.slug, p)
  })
  SEED_PROJECTS.forEach((seed) => {
    if (removed.has(seed.slug)) return
    if (!bySlug.has(seed.slug)) {
      bySlug.set(seed.slug, { ...seed, images: [], journal: [], createdAt: new Date().toISOString() })
    } else {
      const cur = bySlug.get(seed.slug)
      bySlug.set(seed.slug, {
        ...seed,
        ...cur,
        name: cur.name || seed.name,
        summary: cur.summary || seed.summary || '',
        // Prefer saved copy so admin edits are never overwritten by seed text.
        description: cur.description || seed.description,
        legacyHref: cur.legacyHref ?? seed.legacyHref,
      })
    }
  })
  // Keep seed order first, then any extra custom projects
  const seedSlugs = SEED_PROJECTS.map((p) => p.slug)
  const ordered = seedSlugs.map((s) => bySlug.get(s)).filter(Boolean)
  bySlug.forEach((p, slug) => {
    if (!seedSlugs.includes(slug) && !removed.has(slug)) ordered.push(p)
  })
  return ordered
}

/** Scan folders, rebuild pages, persist image lists. */
export function syncProjectsFromDisk() {
  ensureCms()
  let projects = mergeSeedProjects(readProjectsRaw())

  projects = projects.map((project) => {
    const slug = project.slug || project.id
    const { projectDir, imagesDir, journalDir } = ensureProjectFolders(slug)
    const images = listImagesInDir(imagesDir, `/cms-projects/${slug}/images`)
    const journalFromDisk = listJournalInDir(journalDir, `/cms-projects/${slug}/journal`)
    // Prefer disk journal images; keep captions from JSON when same filename
    const captionMap = new Map(
      (project.journal || []).map((j) => [String(j.image || '').split('/').pop(), j.caption || '']),
    )
    const journal = journalFromDisk.map((entry) => {
      const file = entry.image.split('/').pop()
      return { ...entry, caption: entry.caption || captionMap.get(file) || '' }
    })

    const next = {
      ...project,
      slug,
      href: `/cms-projects/${slug}/`,
      images,
      journal,
    }
    fs.writeFileSync(path.join(projectDir, 'index.html'), buildProjectPage(next), 'utf8')
    return next
  })

  writeProjects(projects)
  return projects
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    const body = await readBody(req)
    if (!body.password || body.password !== getAdminPassword()) {
      return sendJson(res, 401, { error: 'Incorrect password' })
    }
    const token = crypto.randomBytes(24).toString('hex')
    tokens.set(token, { expiresAt: Date.now() + 1000 * 60 * 60 * 12 })
    return sendJson(res, 200, { ok: true, token })
  } catch {
    return sendJson(res, 400, { error: 'Invalid request' })
  }
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    const body = await readBody(req)
    const header = req.headers.authorization || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
    const token = bearer || body.token || ''
    if (token) tokens.delete(token)
    return sendJson(res, 200, { ok: true })
  } catch {
    return sendJson(res, 200, { ok: true })
  }
}

async function handleGetProjects(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    return sendJson(res, 200, { projects: syncProjectsFromDisk() })
  } catch (err) {
    console.error('[shaila-admin] get projects', err)
    return sendJson(res, 500, { error: 'Could not load projects' })
  }
}

async function handleCreateProject(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    const body = await readBody(req)
    if (!isAuthed(req, body)) {
      return sendJson(res, 401, { error: 'Unauthorized. Please log in again.' })
    }

    const name = String(body.name || '').trim()
    const description = String(body.description || '').trim()
    if (!name) return sendJson(res, 400, { error: 'Project name is required' })
    if (!description) return sendJson(res, 400, { error: 'Description is required' })

    const projects = syncProjectsFromDisk()
    const slug = uniqueSlug(slugify(name), projects)
    const id = crypto.randomBytes(8).toString('hex')
    const { projectDir, imagesDir, journalDir } = ensureProjectFolders(slug)

    const imageInputs = Array.isArray(body.images) ? body.images : []
    imageInputs.forEach((img, index) => {
      if (!img?.data) return
      const ext = extensionFromMime(img.type)
      saveBase64Image(img.data, path.join(imagesDir, `project-${index + 1}${ext}`))
    })

    const journalInputs = Array.isArray(body.journal) ? body.journal : []
    journalInputs.forEach((entry, index) => {
      if (!entry?.data) return
      const ext = extensionFromMime(entry.type)
      const filename = `journal-${index + 1}${ext}`
      if (saveBase64Image(entry.data, path.join(journalDir, filename))) {
        const caption = String(entry.caption || '').trim()
        if (caption) {
          fs.writeFileSync(path.join(journalDir, `journal-${index + 1}.txt`), `${caption}\n`, 'utf8')
        }
      }
    })

    const summary = String(body.summary || '').trim() || description.split(/(?<=\.)\s+/)[0] || description.slice(0, 140)
    const removed = readRemovedSlugs()
    removed.delete(slug)
    writeRemovedSlugs(removed)

    const draft = {
      id,
      slug,
      name,
      summary,
      description,
      legacyHref: null,
      createdAt: new Date().toISOString(),
    }
    projects.unshift(draft)
    writeProjects(projects)
    const synced = syncProjectsFromDisk()
    const project = synced.find((p) => p.slug === slug)
    return sendJson(res, 201, { ok: true, project })
  } catch (err) {
    console.error('[shaila-admin]', err)
    return sendJson(res, 500, { error: 'Could not save project' })
  }
}

async function handleUpdateProject(req, res, slug) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  try {
    const body = await readBody(req)
    if (!isAuthed(req, body)) {
      return sendJson(res, 401, { error: 'Unauthorized. Please log in again.' })
    }

    const projects = syncProjectsFromDisk()
    const index = projects.findIndex((p) => p.slug === slug)
    if (index === -1) return sendJson(res, 404, { error: 'Project not found' })

    const current = projects[index]
    const name = String(body.name ?? current.name ?? '').trim()
    const description = String(body.description ?? current.description ?? '').trim()
    const summary = String(body.summary ?? current.summary ?? '').trim()
    if (!name) return sendJson(res, 400, { error: 'Project name is required' })
    if (!description) return sendJson(res, 400, { error: 'Description is required' })

    const { imagesDir, journalDir } = ensureProjectFolders(slug)

    const removeImages = Array.isArray(body.removeImages) ? body.removeImages : []
    removeImages.forEach((src) => {
      const file = path.basename(String(src || ''))
      safeUnlinkUnder(imagesDir, file)
    })

    const removeJournal = Array.isArray(body.removeJournal) ? body.removeJournal : []
    removeJournal.forEach((src) => {
      const file = path.basename(String(src || ''))
      const base = file.replace(/\.[^.]+$/, '')
      safeUnlinkUnder(journalDir, file)
      safeUnlinkUnder(journalDir, `${base}.txt`)
    })

    const existingImages = listImagesInDir(imagesDir, `/cms-projects/${slug}/images`)
    const imageInputs = Array.isArray(body.images) ? body.images : []
    imageInputs.forEach((img, i) => {
      if (!img?.data) return
      const ext = extensionFromMime(img.type)
      const stamp = Date.now() + i
      saveBase64Image(img.data, path.join(imagesDir, `project-${stamp}${ext}`))
    })

    const journalInputs = Array.isArray(body.journal) ? body.journal : []
    journalInputs.forEach((entry, i) => {
      if (!entry?.data) return
      const ext = extensionFromMime(entry.type)
      const stamp = Date.now() + i
      const filename = `journal-${stamp}${ext}`
      if (saveBase64Image(entry.data, path.join(journalDir, filename))) {
        const caption = String(entry.caption || '').trim()
        if (caption) {
          fs.writeFileSync(path.join(journalDir, `journal-${stamp}.txt`), `${caption}\n`, 'utf8')
        }
      }
    })

    // Optional caption updates for existing journal files
    const journalCaptions = Array.isArray(body.journalCaptions) ? body.journalCaptions : []
    journalCaptions.forEach((entry) => {
      const file = path.basename(String(entry?.image || ''))
      if (!file) return
      const base = file.replace(/\.[^.]+$/, '')
      const caption = String(entry.caption || '').trim()
      const captionPath = path.join(journalDir, `${base}.txt`)
      if (caption) fs.writeFileSync(captionPath, `${caption}\n`, 'utf8')
      else if (fs.existsSync(captionPath)) fs.unlinkSync(captionPath)
    })

    projects[index] = {
      ...current,
      name,
      summary: summary || description.split(/(?<=\.)\s+/)[0] || description.slice(0, 140),
      description,
      updatedAt: new Date().toISOString(),
    }
    writeProjects(projects)
    const synced = syncProjectsFromDisk()
    const project = synced.find((p) => p.slug === slug)
    return sendJson(res, 200, { ok: true, project, previousImageCount: existingImages.length })
  } catch (err) {
    console.error('[shaila-admin] update', err)
    return sendJson(res, 500, { error: 'Could not update project' })
  }
}

async function handleDeleteProject(req, res, slug) {
  if (req.method !== 'DELETE') return sendJson(res, 405, { error: 'Method not allowed' })
  try {
    const body = await readBody(req).catch(() => ({}))
    if (!isAuthed(req, body)) {
      return sendJson(res, 401, { error: 'Unauthorized. Please log in again.' })
    }

    const projects = syncProjectsFromDisk()
    const next = projects.filter((p) => p.slug !== slug)
    if (next.length === projects.length) {
      return sendJson(res, 404, { error: 'Project not found' })
    }

    const removed = readRemovedSlugs()
    removed.add(slug)
    writeRemovedSlugs(removed)
    writeProjects(next)
    removeDirRecursive(path.join(CMS_DIR, slug))
    syncProjectsFromDisk()
    return sendJson(res, 200, { ok: true, slug })
  } catch (err) {
    console.error('[shaila-admin] delete', err)
    return sendJson(res, 500, { error: 'Could not delete project' })
  }
}

export function shailaAdminPlugin() {
  const mount = (middlewares) => {
    middlewares.use(async (req, res, next) => {
      const url = req.url?.split('?')[0]
      if (url === '/api/admin/login') return handleLogin(req, res)
      if (url === '/api/admin/logout') return handleLogout(req, res)
      if (url === '/api/projects' && req.method === 'GET') return handleGetProjects(req, res)
      if (url === '/api/admin/projects' && req.method === 'POST') return handleCreateProject(req, res)

      const projectMatch = url?.match(/^\/api\/admin\/projects\/([^/]+)$/)
      if (projectMatch) {
        const slug = decodeURIComponent(projectMatch[1])
        if (req.method === 'PUT' || req.method === 'PATCH') return handleUpdateProject(req, res, slug)
        if (req.method === 'DELETE') return handleDeleteProject(req, res, slug)
      }
      return next()
    })
  }

  return {
    name: 'shaila-admin',
    buildStart() {
      try {
        syncProjectsFromDisk()
      } catch (err) {
        console.warn('[shaila-admin] sync skipped', err)
      }
    },
    configureServer(server) {
      // Ensure seed folders exist as soon as dev starts
      try {
        syncProjectsFromDisk()
      } catch (err) {
        console.warn('[shaila-admin] initial sync failed', err)
      }
      mount(server.middlewares)
    },
    configurePreviewServer(server) {
      mount(server.middlewares)
    },
  }
}
