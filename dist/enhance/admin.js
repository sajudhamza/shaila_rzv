/* Shaila Rizvi admin: login + project questionnaire */
(function () {
  'use strict'

  const TOKEN_KEY = 'shaila_admin_token'
  const STEPS = ['Name', 'Description', 'Images', 'Journal', 'Review']

  const state = {
    loggedIn: false,
    step: 0,
    name: '',
    description: '',
    images: [],
    journal: [],
  }

  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  }

  function setToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token)
      else sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  }

  function fileToData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve({ data: String(reader.result || ''), type: file.type, name: file.name })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag)
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') node.className = v
      else if (k === 'text') node.textContent = v
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v)
      else if (v != null) node.setAttribute(k, v)
    })
    children.forEach((child) => {
      if (child == null) return
      node.append(typeof child === 'string' ? document.createTextNode(child) : child)
    })
    return node
  }

  function ensureStyles() {
    if (document.querySelector('link[href="/enhance/project-page.css"]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/enhance/project-page.css'
    document.head.appendChild(link)
  }

  function mountChrome() {
    if (document.querySelector('.sr-admin-fab')) return

    const fab = el('button', {
      type: 'button',
      className: 'sr-admin-fab',
      text: getToken() ? 'Add Project' : 'Login',
      id: 'sr-admin-fab',
    })
    fab.addEventListener('click', () => openPanel())

    const overlay = el('div', { className: 'sr-admin-overlay', id: 'sr-admin-overlay' })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePanel()
    })

    document.body.append(fab, overlay)
    state.loggedIn = Boolean(getToken())
    updateFab()
  }

  function updateFab() {
    const fab = document.getElementById('sr-admin-fab')
    if (!fab) return
    fab.textContent = state.loggedIn ? 'Add Project' : 'Login'
  }

  function openPanel() {
    const overlay = document.getElementById('sr-admin-overlay')
    if (!overlay) return
    overlay.innerHTML = ''
    overlay.appendChild(renderPanel())
    overlay.classList.add('is-open')
    document.body.style.overflow = 'hidden'
  }

  function closePanel() {
    const overlay = document.getElementById('sr-admin-overlay')
    if (!overlay) return
    overlay.classList.remove('is-open')
    overlay.innerHTML = ''
    document.body.style.overflow = ''
  }

  function renderPanel() {
    const panel = el('div', { className: 'sr-admin-panel' })
    if (!state.loggedIn) {
      panel.append(
        el('h2', { text: 'Studio Login' }),
        el('p', {
          className: 'sr-admin-help',
          text: 'Sign in to add a project. It will appear in Projects and Case Studies.',
        }),
      )
      const form = el('form')
      const pass = el('input', { type: 'password', required: 'true', placeholder: 'Password', autocomplete: 'current-password' })
      const err = el('p', { className: 'sr-admin-error' })
      form.append(
        el('div', { className: 'sr-admin-field' }, [el('label', { text: 'Password' }), pass]),
        err,
        el('div', { className: 'sr-admin-actions' }, [
          el('button', { type: 'submit', className: 'sr-admin-btn primary', text: 'Enter' }),
          el('button', { type: 'button', className: 'sr-admin-btn', text: 'Cancel', onClick: closePanel }),
        ]),
      )
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        err.textContent = ''
        try {
          const data = await api('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password: pass.value }),
          })
          setToken(data.token)
          state.loggedIn = true
          state.step = 0
          updateFab()
          openPanel()
        } catch (ex) {
          err.textContent = ex.message || 'Incorrect password'
        }
      })
      panel.append(form)
      return panel
    }

    panel.append(
      el('h2', { text: 'New Project' }),
      el('p', {
        className: 'sr-admin-help',
        text: 'A short guided flow: name, story, project images, then journal images.',
      }),
      renderStepPills(),
      renderStepBody(),
    )
    return panel
  }

  function renderStepPills() {
    const wrap = el('div', { className: 'sr-admin-steps' })
    STEPS.forEach((label, i) => {
      wrap.append(
        el('span', {
          className:
            'sr-admin-step-pill' +
            (i === state.step ? ' is-active' : '') +
            (i < state.step ? ' is-done' : ''),
          text: `${i + 1}. ${label}`,
        }),
      )
    })
    return wrap
  }

  function renderStepBody() {
    const wrap = el('div')
    const err = el('p', { className: 'sr-admin-error', id: 'sr-admin-err' })
    const ok = el('p', { className: 'sr-admin-success', id: 'sr-admin-ok' })

    if (state.step === 0) {
      const input = el('input', {
        type: 'text',
        value: state.name,
        placeholder: 'e.g. Bungalow East Village',
        required: 'true',
      })
      input.addEventListener('input', () => {
        state.name = input.value
      })
      wrap.append(
        el('div', { className: 'sr-admin-field' }, [
          el('label', { text: 'Project name' }),
          input,
        ]),
      )
    }

    if (state.step === 1) {
      const ta = el('textarea', {
        placeholder: 'Write the project story in your own words...',
      })
      ta.value = state.description
      ta.addEventListener('input', () => {
        state.description = ta.value
      })
      wrap.append(
        el('div', { className: 'sr-admin-field' }, [
          el('label', { text: 'Description' }),
          ta,
        ]),
      )
    }

    if (state.step === 2) {
      const input = el('input', { type: 'file', accept: 'image/*', multiple: 'true' })
      const preview = el('div', { className: 'sr-admin-preview', id: 'sr-img-preview' })
      input.addEventListener('change', async () => {
        const files = Array.from(input.files || [])
        state.images = await Promise.all(files.map(fileToData))
        preview.innerHTML = ''
        state.images.forEach((img) => {
          preview.append(el('img', { src: img.data, alt: img.name || 'Project image' }))
        })
      })
      // restore preview
      state.images.forEach((img) => {
        preview.append(el('img', { src: img.data, alt: img.name || 'Project image' }))
      })
      wrap.append(
        el('p', {
          className: 'sr-admin-help',
          text: 'Add the main project photos. These show in the case study gallery.',
        }),
        el('div', { className: 'sr-admin-field' }, [
          el('label', { text: 'Project images' }),
          input,
        ]),
        preview,
      )
    }

    if (state.step === 3) {
      const list = el('div', { id: 'sr-journal-list' })
      const redraw = () => {
        list.innerHTML = ''
        state.journal.forEach((entry, idx) => {
          const row = el('div', { className: 'sr-journal-row' })
          const caption = el('input', {
            type: 'text',
            value: entry.caption || '',
            placeholder: 'Journal note (optional)',
          })
          caption.addEventListener('input', () => {
            state.journal[idx].caption = caption.value
          })
          const thumb = entry.data
            ? el('img', { src: entry.data, alt: 'Journal', style: 'width:100%;aspect-ratio:16/10;object-fit:cover;margin-bottom:0.5rem' })
            : null
          const remove = el('button', {
            type: 'button',
            className: 'sr-admin-btn',
            text: 'Remove',
            onClick: () => {
              state.journal.splice(idx, 1)
              redraw()
            },
          })
          row.append(thumb, caption, el('div', { className: 'sr-admin-actions' }, [remove]))
          list.append(row)
        })
      }
      redraw()

      const addBtn = el('button', {
        type: 'button',
        className: 'sr-admin-btn',
        text: 'Add journal image',
        onClick: () => {
          const picker = el('input', { type: 'file', accept: 'image/*', style: 'display:none' })
          picker.addEventListener('change', async () => {
            const file = picker.files && picker.files[0]
            if (!file) return
            const data = await fileToData(file)
            state.journal.push({ ...data, caption: '' })
            redraw()
            picker.remove()
          })
          document.body.appendChild(picker)
          picker.click()
        },
      })

      wrap.append(
        el('p', {
          className: 'sr-admin-help',
          text: 'Journal entries are process shots or notes. Add one image at a time, with an optional caption.',
        }),
        list,
        el('div', { className: 'sr-admin-actions' }, [addBtn]),
      )
    }

    if (state.step === 4) {
      wrap.append(
        el('p', { className: 'sr-admin-help', text: 'Review before publishing to the site.' }),
        el('p', { text: `Name: ${state.name || '(missing)'}` }),
        el('p', { text: `Description: ${(state.description || '').slice(0, 180)}${(state.description || '').length > 180 ? '…' : ''}` }),
        el('p', { text: `Project images: ${state.images.length}` }),
        el('p', { text: `Journal images: ${state.journal.length}` }),
      )
    }

    const actions = el('div', { className: 'sr-admin-actions' })
    if (state.step > 0) {
      actions.append(
        el('button', {
          type: 'button',
          className: 'sr-admin-btn',
          text: 'Back',
          onClick: () => {
            state.step -= 1
            openPanel()
          },
        }),
      )
    }
    if (state.step < STEPS.length - 1) {
      actions.append(
        el('button', {
          type: 'button',
          className: 'sr-admin-btn primary',
          text: 'Continue',
          onClick: () => {
            err.textContent = ''
            if (state.step === 0 && !state.name.trim()) {
              err.textContent = 'Please enter a project name.'
              return
            }
            if (state.step === 1 && !state.description.trim()) {
              err.textContent = 'Please enter a description.'
              return
            }
            state.step += 1
            openPanel()
          },
        }),
      )
    } else {
      actions.append(
        el('button', {
          type: 'button',
          className: 'sr-admin-btn primary',
          text: 'Publish project',
          onClick: async () => {
            err.textContent = ''
            ok.textContent = ''
            try {
              const data = await api('/api/admin/projects', {
                method: 'POST',
                body: JSON.stringify({
                  token: getToken(),
                  name: state.name.trim(),
                  description: state.description.trim(),
                  images: state.images,
                  journal: state.journal,
                }),
              })
              ok.textContent = 'Published. Updating the page…'
              await injectProjects()
              state.name = ''
              state.description = ''
              state.images = []
              state.journal = []
              state.step = 0
              setTimeout(() => {
                closePanel()
                if (data.project?.href) {
                  // soft highlight on home; stay on page
                }
              }, 700)
            } catch (ex) {
              err.textContent = ex.message || 'Could not publish'
            }
          },
        }),
      )
    }

    actions.append(
      el('button', {
        type: 'button',
        className: 'sr-admin-btn',
        text: 'Log out',
        onClick: async () => {
          try {
            await api('/api/admin/logout', { method: 'POST', body: JSON.stringify({ token: getToken() }) })
          } catch {
            /* ignore */
          }
          setToken('')
          state.loggedIn = false
          updateFab()
          closePanel()
        },
      }),
      el('button', {
        type: 'button',
        className: 'sr-admin-btn',
        text: 'Close',
        onClick: closePanel,
      }),
    )

    wrap.append(err, ok, actions)
    return wrap
  }

  function buildCaseStudyBlock(project) {
    const cover = project.images?.[0] || '/webflow/plugins/Basic/assets/placeholder.60f9b1840c.svg'
    const section = document.createElement('div')
    section.className = 'case--study-spacing sr-cms-case'
    section.dataset.cmsSlug = project.slug
    section.innerHTML = `
      <div class="case-study-grid">
        <div class="left-case-study">
          <div class="case-study-conten">
            <div class="grdn-doth"></div>
            <h6 class="case-study-heading-2"><em class="italic-text">Case Study</em></h6>
          </div>
          <h3 class="logo-name-cms">${escapeHtml(project.name)}</h3>
        </div>
        <div class="left-case-study">
          <p class="case-_study-paragrah">${escapeHtml(project.description)}</p>
          <div class="cse-study-marque">
            <a href="${escapeHtml(project.href)}" class="marque-link w-inline-block">
              <div class="div-block-19">
                <div class="marque-move">
                  <div class="marque-text">view case study</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
      <a href="${escapeHtml(project.href)}" class="sr-cms-cover-link">
        <img src="${escapeHtml(cover)}" alt="${escapeHtml(project.name)}" class="showcase-img" loading="lazy" />
      </a>
    `
    return section
  }

  function buildAllCaseChip(project) {
    const item = document.createElement('div')
    item.setAttribute('role', 'listitem')
    item.className = 'w-dyn-item sr-cms-chip'
    item.dataset.cmsSlug = project.slug
    item.innerHTML = `
      <div class="case-study-box-wrappar">
        <a href="${escapeHtml(project.href)}" class="case-study-one w-inline-block">
          <h3 class="heading">${escapeHtml(project.name)}</h3>
        </a>
      </div>
    `
    return item
  }

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  async function injectProjects() {
    let projects = []
    try {
      const live = await fetch(`/api/projects?t=${Date.now()}`, { cache: 'no-store' })
      if (live.ok) {
        const data = await live.json()
        projects = data.projects || []
      }
    } catch {
      /* fallback */
    }
    if (!projects.length) {
      try {
        const res = await fetch(`/cms-projects/projects.json?t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) projects = await res.json()
      } catch {
        projects = []
      }
    }
    if (!Array.isArray(projects)) projects = []

    // Detailed case study section: insert before "All Case Studies"
    const allSection = document.querySelector('.all-case-study-section')
    const caseSection = document.querySelector('.case-study-section')
    document.querySelectorAll('.sr-cms-case').forEach((n) => n.remove())

    if (caseSection && projects.length) {
      const frag = document.createDocumentFragment()
      projects.forEach((project) => frag.appendChild(buildCaseStudyBlock(project)))
      if (allSection && caseSection.contains(allSection)) {
        caseSection.insertBefore(frag, allSection)
      } else {
        caseSection.appendChild(frag)
      }
      requestAnimationFrame(() => {
        document.querySelectorAll('.sr-cms-case').forEach((n) => n.classList.add('is-in'))
      })
    }

    // All Case Studies vertical list
    const list = document.querySelector('.collection-list-4.w-dyn-items')
    document.querySelectorAll('.sr-cms-chip').forEach((n) => n.remove())
    if (list) {
      projects.forEach((project) => list.appendChild(buildAllCaseChip(project)))
    }

    // Give case studies section an id for deep links if missing
    if (caseSection && !caseSection.id) caseSection.id = 'case-studies'
  }

  function init() {
    ensureStyles()
    mountChrome()
    injectProjects()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
