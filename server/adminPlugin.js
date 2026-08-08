import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CMS_DIR = path.join(ROOT, 'public', 'cms-projects')
const PROJECTS_FILE = path.join(CMS_DIR, 'projects.json')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const tokens = new Map()

/** Seeded studio projects (folders + home/case study cards). */
const SEED_PROJECTS = [
  {
    id: 'bungalow',
    slug: 'bungalow',
    name: 'Bungalow',
    description:
      "Bungalow in NYC's East Village: A luxe retreat inspired by vintage Indian living, meticulously crafted.",
    legacyHref: '/desing-cms/bungalow/',
  },
  {
    id: 'chote-miya',
    slug: 'chote-miya',
    name: 'Chote Miya',
    description:
      "Chote Miya: A vibrant tribute to 90's India, blending street flavors with nostalgic ambiance in NYC.",
    legacyHref: '/desing-cms/chote-miya/',
  },
  {
    id: 'gupshup',
    slug: 'gupshup',
    name: 'GupShup',
    description:
      'GupShup (Bombay House) in NYC: 1970s Bombay nostalgia meets vibrant ambiance, blending Indian culture with creativity.',
    legacyHref: '/desing-cms/gupshup/',
  },
  {
    id: 'ammi',
    slug: 'ammi',
    name: 'Ammi',
    description:
      'Ammi at Pier 57, NYC: Homestyle Indian cuisine, vibrant design, and open kitchen for immersive dining.',
    legacyHref: '/desing-cms/ammi/',
  },
  {
    id: 'movie',
    slug: 'movie',
    name: 'Zindagi Kashmakash',
    description:
      "Zindagi Kashmakash set design crafted to match the film's narrative, era and style with visually compelling interiors.",
    legacyHref: '/desing-cms/movie/',
  },
  {
    id: 'punjab-meet-house',
    slug: 'punjab-meet-house',
    name: 'Punjab Meet House',
    description:
      'Punjab Meet House in Jersey City: an upscale casual dining room shaped around the warmth of a Punjabi home. Designed by Shaila Rizvi Studio with Phulkari-inspired color, handcrafted furnishings, Indian imports, layered textures, and soft lighting across about 2,245 sq ft at Haus25, Exchange Place.',
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} | Shaila Rizvi</title>
  <meta name="description" content="${escapeHtml((project.description || '').slice(0, 160))}" />
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
      <p class="srp-kicker">Case Study</p>
      <h1>${escapeHtml(project.name)}</h1>
      <p class="srp-lead">${escapeHtml(project.description || '')}</p>
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
</body>
</html>
`
}

function mergeSeedProjects(existing) {
  const bySlug = new Map()
  existing.forEach((p) => {
    if (p?.slug) bySlug.set(p.slug, p)
  })
  SEED_PROJECTS.forEach((seed) => {
    if (!bySlug.has(seed.slug)) {
      bySlug.set(seed.slug, { ...seed, images: [], journal: [], createdAt: new Date().toISOString() })
    } else {
      const cur = bySlug.get(seed.slug)
      bySlug.set(seed.slug, {
        ...seed,
        ...cur,
        name: cur.name || seed.name,
        description: cur.description || seed.description,
        legacyHref: cur.legacyHref ?? seed.legacyHref,
      })
    }
  })
  // Keep seed order first, then any extra custom projects
  const seedSlugs = SEED_PROJECTS.map((p) => p.slug)
  const ordered = seedSlugs.map((s) => bySlug.get(s)).filter(Boolean)
  bySlug.forEach((p, slug) => {
    if (!seedSlugs.includes(slug)) ordered.push(p)
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

    const draft = {
      id,
      slug,
      name,
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

export function shailaAdminPlugin() {
  const mount = (middlewares) => {
    middlewares.use(async (req, res, next) => {
      const url = req.url?.split('?')[0]
      if (url === '/api/admin/login') return handleLogin(req, res)
      if (url === '/api/admin/logout') return handleLogout(req, res)
      if (url === '/api/projects' && req.method === 'GET') return handleGetProjects(req, res)
      if (url === '/api/admin/projects') return handleCreateProject(req, res)
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
