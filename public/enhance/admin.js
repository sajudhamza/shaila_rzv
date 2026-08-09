/* Shaila Rizvi admin: login + manage / add / edit / delete projects */
(function () {
  'use strict'

  const TOKEN_KEY = 'shaila_admin_token'
  const STEPS = ['Name', 'Description', 'Images', 'Journal', 'Review']

  const state = {
    loggedIn: false,
    view: 'list', // list | create | edit
    projects: [],
    step: 0,
    editingSlug: '',
    name: '',
    summary: '',
    description: '',
    images: [], // new uploads (data urls)
    journal: [], // new journal uploads
    existingImages: [],
    existingJournal: [],
    removeImages: [],
    removeJournal: [],
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
      else if (k === 'html') node.innerHTML = v
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

  function resetDraft() {
    state.step = 0
    state.editingSlug = ''
    state.name = ''
    state.summary = ''
    state.description = ''
    state.images = []
    state.journal = []
    state.existingImages = []
    state.existingJournal = []
    state.removeImages = []
    state.removeJournal = []
  }

  function mountChrome() {
    if (document.querySelector('#sr-admin-fab')) return

    const fab = el('button', {
      type: 'button',
      className: 'sr-admin-fab',
      text: getToken() ? 'Manage' : 'Login',
      id: 'sr-admin-fab',
      'aria-label': getToken() ? 'Manage projects' : 'Studio login',
    })
    fab.addEventListener('click', () => openPanel())

    const overlay = el('div', { className: 'sr-admin-overlay', id: 'sr-admin-overlay' })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePanel()
    })

    // Top-left only: keeps clear of the menu orb (top-right) and AI assistant (bottom-right).
    const projectNav = document.querySelector('.srp-header .srp-nav')
    if (projectNav) {
      fab.classList.add('sr-admin-fab--header')
      projectNav.appendChild(fab)
    } else {
      fab.classList.add('sr-admin-fab--corner')
      document.body.appendChild(fab)
    }

    document.body.appendChild(overlay)
    state.loggedIn = Boolean(getToken())
    updateFab()
  }

  function updateFab() {
    const fab = document.getElementById('sr-admin-fab')
    if (!fab) return
    fab.textContent = state.loggedIn ? 'Manage' : 'Login'
  }

  async function openPanel() {
    const overlay = document.getElementById('sr-admin-overlay')
    if (!overlay) return
    overlay.innerHTML = ''
    overlay.appendChild(el('div', { className: 'sr-admin-panel', html: '<p class="sr-admin-help">Loading…</p>' }))
    overlay.classList.add('is-open')
    document.body.style.overflow = 'hidden'

    if (state.loggedIn && state.view === 'list') {
      try {
        const data = await api(`/api/projects?t=${Date.now()}`)
        state.projects = data.projects || []
      } catch {
        state.projects = []
      }
    }

    overlay.innerHTML = ''
    overlay.appendChild(renderPanel())
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
          text: 'Sign in to add, edit, or remove projects. Changes update Case Studies and project pages.',
        }),
      )
      const form = el('form')
      const pass = el('input', {
        type: 'password',
        required: 'true',
        placeholder: 'Password',
        autocomplete: 'current-password',
      })
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
          state.view = 'list'
          resetDraft()
          updateFab()
          openPanel()
        } catch (ex) {
          err.textContent = ex.message || 'Incorrect password'
        }
      })
      panel.append(form)
      return panel
    }

    if (state.view === 'list') {
      panel.append(renderListView())
      return panel
    }

    const title = state.view === 'edit' ? `Edit · ${state.name || state.editingSlug}` : 'New Project'
    panel.append(
      el('h2', { text: title }),
      el('p', {
        className: 'sr-admin-help',
        text:
          state.view === 'edit'
            ? 'Update the story, card blurb, and galleries. Saved changes refresh Case Studies and this project page.'
            : 'Guided flow: name, story, project images, then journal images.',
      }),
      state.view === 'create' ? renderStepPills() : null,
      renderEditorBody(),
    )
    return panel
  }

  function renderListView() {
    const wrap = el('div')
    wrap.append(
      el('h2', { text: 'Projects' }),
      el('p', {
        className: 'sr-admin-help',
        text: 'Edit any project, add a new one, or delete. Home Case Studies and project pages stay in sync.',
      }),
    )

    const list = el('div', { className: 'sr-admin-project-list' })
    if (!state.projects.length) {
      list.append(el('p', { className: 'sr-admin-help', text: 'No projects yet.' }))
    }
    state.projects.forEach((project) => {
      const row = el('div', { className: 'sr-admin-project-row' })
      const cover = project.images?.[0]
      const meta = el('div', { className: 'sr-admin-project-meta' }, [
        cover ? el('img', { src: cover, alt: '', className: 'sr-admin-project-thumb' }) : el('div', { className: 'sr-admin-project-thumb is-empty' }),
        el('div', {}, [
          el('strong', { text: project.name }),
          el('p', {
            className: 'sr-admin-help',
            text: `${(project.summary || project.description || '').slice(0, 90)}${(project.summary || project.description || '').length > 90 ? '…' : ''}`,
          }),
          el('p', {
            className: 'sr-admin-help',
            text: `${(project.images || []).length} images · ${(project.journal || []).length} journal`,
          }),
        ]),
      ])
      const actions = el('div', { className: 'sr-admin-project-actions' }, [
        el('button', {
          type: 'button',
          className: 'sr-admin-btn',
          text: 'Edit',
          onClick: () => startEdit(project),
        }),
        el('a', {
          className: 'sr-admin-btn',
          href: project.href || `/cms-projects/${project.slug}/`,
          text: 'View',
          target: '_blank',
          rel: 'noopener',
        }),
        el('button', {
          type: 'button',
          className: 'sr-admin-btn danger',
          text: 'Delete',
          onClick: () => deleteProject(project),
        }),
      ])
      row.append(meta, actions)
      list.append(row)
    })

    wrap.append(
      list,
      el('div', { className: 'sr-admin-actions' }, [
        el('button', {
          type: 'button',
          className: 'sr-admin-btn primary',
          text: 'Add project',
          onClick: () => {
            resetDraft()
            state.view = 'create'
            openPanel()
          },
        }),
        el('button', {
          type: 'button',
          className: 'sr-admin-btn',
          text: 'Log out',
          onClick: logout,
        }),
        el('button', {
          type: 'button',
          className: 'sr-admin-btn',
          text: 'Close',
          onClick: closePanel,
        }),
      ]),
    )
    return wrap
  }

  function startEdit(project) {
    state.view = 'edit'
    state.editingSlug = project.slug
    state.name = project.name || ''
    state.summary = project.summary || ''
    state.description = project.description || ''
    state.existingImages = [...(project.images || [])]
    state.existingJournal = (project.journal || []).map((j) => ({
      image: j.image,
      caption: j.caption || '',
    }))
    state.images = []
    state.journal = []
    state.removeImages = []
    state.removeJournal = []
    state.step = 0
    openPanel()
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete “${project.name}”? This removes its folder and Case Study card.`)) return
    try {
      await api(`/api/admin/projects/${encodeURIComponent(project.slug)}`, {
        method: 'DELETE',
        body: JSON.stringify({ token: getToken() }),
      })
      await injectProjects()
      if (location.pathname.includes(`/cms-projects/${project.slug}`)) {
        location.href = '/#case-studies'
        return
      }
      state.view = 'list'
      openPanel()
    } catch (ex) {
      window.alert(ex.message || 'Could not delete project')
    }
  }

  async function logout() {
    try {
      await api('/api/admin/logout', { method: 'POST', body: JSON.stringify({ token: getToken() }) })
    } catch {
      /* ignore */
    }
    setToken('')
    state.loggedIn = false
    state.view = 'list'
    resetDraft()
    updateFab()
    closePanel()
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

  function renderExistingImageGrid(kind) {
    const items = kind === 'images' ? state.existingImages : state.existingJournal
    const removeList = kind === 'images' ? state.removeImages : state.removeJournal
    const grid = el('div', { className: 'sr-admin-preview' })
    items.forEach((item) => {
      const src = typeof item === 'string' ? item : item.image
      if (removeList.includes(src)) return
      const cell = el('div', { className: 'sr-admin-thumb-wrap' })
      cell.append(
        el('img', { src, alt: '' }),
        el('button', {
          type: 'button',
          className: 'sr-admin-btn danger sr-admin-thumb-remove',
          text: 'Remove',
          onClick: () => {
            removeList.push(src)
            openPanel()
          },
        }),
      )
      if (kind === 'journal' && typeof item === 'object') {
        const caption = el('input', {
          type: 'text',
          value: item.caption || '',
          placeholder: 'Caption',
        })
        caption.addEventListener('input', () => {
          item.caption = caption.value
        })
        cell.append(caption)
      }
      grid.append(cell)
    })
    if (!grid.childNodes.length) {
      grid.append(el('p', { className: 'sr-admin-help', text: 'No images yet.' }))
    }
    return grid
  }

  function renderEditorBody() {
    const wrap = el('div')
    const err = el('p', { className: 'sr-admin-error', id: 'sr-admin-err' })
    const ok = el('p', { className: 'sr-admin-success', id: 'sr-admin-ok' })
    const isEdit = state.view === 'edit'
    const step = isEdit ? -1 : state.step

    const showName = isEdit || step === 0
    const showDesc = isEdit || step === 1
    const showImages = isEdit || step === 2
    const showJournal = isEdit || step === 3
    const showReview = !isEdit && step === 4

    if (showName) {
      const input = el('input', { type: 'text', value: state.name, placeholder: 'e.g. Bungalow East Village' })
      input.addEventListener('input', () => {
        state.name = input.value
      })
      wrap.append(el('div', { className: 'sr-admin-field' }, [el('label', { text: 'Project name' }), input]))
    }

    if (showDesc) {
      if (isEdit) {
        const summary = el('textarea', { placeholder: 'Short blurb for the home Case Studies card...' })
        summary.value = state.summary
        summary.addEventListener('input', () => {
          state.summary = summary.value
        })
        wrap.append(
          el('div', { className: 'sr-admin-field' }, [
            el('label', { text: 'Card summary (home page)' }),
            summary,
          ]),
        )
      }
      const ta = el('textarea', { placeholder: 'Full project story for the case study page...' })
      ta.value = state.description
      ta.style.minHeight = isEdit ? '220px' : '120px'
      ta.addEventListener('input', () => {
        state.description = ta.value
      })
      wrap.append(
        el('div', { className: 'sr-admin-field' }, [
          el('label', { text: isEdit ? 'Full description (case study page)' : 'Description' }),
          ta,
        ]),
      )
    }

    if (showImages) {
      if (isEdit) {
        wrap.append(
          el('p', { className: 'sr-admin-help', text: 'Current project images' }),
          renderExistingImageGrid('images'),
        )
      }
      const input = el('input', { type: 'file', accept: 'image/*', multiple: 'true' })
      const preview = el('div', { className: 'sr-admin-preview' })
      const redrawNew = () => {
        preview.innerHTML = ''
        state.images.forEach((img) => {
          preview.append(el('img', { src: img.data, alt: img.name || 'Project image' }))
        })
      }
      input.addEventListener('change', async () => {
        const files = Array.from(input.files || [])
        const added = await Promise.all(files.map(fileToData))
        state.images = isEdit ? state.images.concat(added) : added
        redrawNew()
      })
      redrawNew()
      wrap.append(
        el('p', {
          className: 'sr-admin-help',
          text: isEdit ? 'Add more project photos (saved when you click Save).' : 'Add the main project photos.',
        }),
        el('div', { className: 'sr-admin-field' }, [el('label', { text: 'Add images' }), input]),
        preview,
      )
    }

    if (showJournal) {
      if (isEdit) {
        wrap.append(
          el('p', { className: 'sr-admin-help', text: 'Current journal images' }),
          renderExistingImageGrid('journal'),
        )
      }
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
          row.append(
            el('img', {
              src: entry.data,
              alt: 'Journal',
              style: 'width:100%;aspect-ratio:16/10;object-fit:cover;margin-bottom:0.5rem',
            }),
            caption,
            el('div', { className: 'sr-admin-actions' }, [
              el('button', {
                type: 'button',
                className: 'sr-admin-btn',
                text: 'Remove',
                onClick: () => {
                  state.journal.splice(idx, 1)
                  redraw()
                },
              }),
            ]),
          )
          list.append(row)
        })
      }
      redraw()
      wrap.append(
        el('p', { className: 'sr-admin-help', text: 'Journal entries are process shots or notes.' }),
        list,
        el('div', { className: 'sr-admin-actions' }, [
          el('button', {
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
          }),
        ]),
      )
    }

    if (showReview) {
      wrap.append(
        el('p', { className: 'sr-admin-help', text: 'Review before publishing to the site.' }),
        el('p', { text: `Name: ${state.name || '(missing)'}` }),
        el('p', {
          text: `Description: ${(state.description || '').slice(0, 180)}${(state.description || '').length > 180 ? '…' : ''}`,
        }),
        el('p', { text: `Project images: ${state.images.length}` }),
        el('p', { text: `Journal images: ${state.journal.length}` }),
      )
    }

    const actions = el('div', { className: 'sr-admin-actions' })

    actions.append(
      el('button', {
        type: 'button',
        className: 'sr-admin-btn',
        text: 'Back to list',
        onClick: () => {
          resetDraft()
          state.view = 'list'
          openPanel()
        },
      }),
    )

    if (!isEdit && state.step > 0) {
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

    if (!isEdit && state.step < STEPS.length - 1) {
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
    } else if (!isEdit) {
      actions.append(
        el('button', {
          type: 'button',
          className: 'sr-admin-btn primary',
          text: 'Publish project',
          onClick: () => publishCreate(err, ok),
        }),
      )
    } else {
      actions.append(
        el('button', {
          type: 'button',
          className: 'sr-admin-btn primary',
          text: 'Save changes',
          onClick: () => saveEdit(err, ok),
        }),
      )
    }

    actions.append(
      el('button', { type: 'button', className: 'sr-admin-btn', text: 'Close', onClick: closePanel }),
    )

    wrap.append(err, ok, actions)
    return wrap
  }

  async function publishCreate(err, ok) {
    err.textContent = ''
    ok.textContent = ''
    try {
      await api('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify({
          token: getToken(),
          name: state.name.trim(),
          description: state.description.trim(),
          summary: state.summary.trim(),
          images: state.images,
          journal: state.journal,
        }),
      })
      ok.textContent = 'Published. Updating Case Studies…'
      await injectProjects()
      resetDraft()
      state.view = 'list'
      setTimeout(() => openPanel(), 400)
    } catch (ex) {
      err.textContent = ex.message || 'Could not publish'
    }
  }

  async function saveEdit(err, ok) {
    err.textContent = ''
    ok.textContent = ''
    if (!state.name.trim() || !state.description.trim()) {
      err.textContent = 'Name and full description are required.'
      return
    }
    try {
      const data = await api(`/api/admin/projects/${encodeURIComponent(state.editingSlug)}`, {
        method: 'PUT',
        body: JSON.stringify({
          token: getToken(),
          name: state.name.trim(),
          summary: state.summary.trim(),
          description: state.description.trim(),
          images: state.images,
          journal: state.journal,
          removeImages: state.removeImages,
          removeJournal: state.removeJournal,
          journalCaptions: state.existingJournal
            .filter((j) => !state.removeJournal.includes(j.image))
            .map((j) => ({ image: j.image, caption: j.caption || '' })),
        }),
      })
      ok.textContent = 'Saved. Refreshing…'
      await injectProjects()
      const href = data.project?.href || `/cms-projects/${state.editingSlug}/`
      if (location.pathname.includes(`/cms-projects/${state.editingSlug}`)) {
        setTimeout(() => {
          location.href = `${href}?t=${Date.now()}`
        }, 350)
        return
      }
      resetDraft()
      state.view = 'list'
      setTimeout(() => openPanel(), 350)
    } catch (ex) {
      err.textContent = ex.message || 'Could not save'
    }
  }

  function findLegacyCover(project) {
    const needles = [project.slug, project.name, project.name?.replace(/\s+/g, '-')].filter(Boolean)
    const blocks = document.querySelectorAll('.case--study-spacing:not(.sr-cms-case)')
    for (const block of blocks) {
      const label = (block.textContent || '').toLowerCase()
      const hit = needles.some(
        (n) =>
          label.includes(String(n).toLowerCase().replace(/-/g, ' ')) ||
          label.includes(String(n).toLowerCase()),
      )
      if (!hit) continue
      const img = [...block.querySelectorAll('img.showcase-img, img')].find((node) => {
        const src = node.getAttribute('src') || ''
        return src && !src.includes('placeholder')
      })
      if (img) return img.currentSrc || img.getAttribute('src')
    }
    return ''
  }

  function buildCaseStudyBlock(project) {
    const cover =
      project.images?.[0] ||
      findLegacyCover(project) ||
      '/webflow/plugins/Basic/assets/placeholder.60f9b1840c.svg'
    const section = document.createElement('div')
    section.className = 'case--study-spacing sr-cms-case'
    section.dataset.cmsSlug = project.slug
    section.innerHTML = `
      <div class="case-study-grid">
        <div class="left-case-study">
          <h3 class="logo-name-cms">${escapeHtml(project.name)}</h3>
        </div>
        <div class="left-case-study">
          <p class="case-_study-paragrah">${escapeHtml(project.summary || project.description)}</p>
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
    state.projects = projects

    const allSection = document.querySelector('.all-case-study-section')
    const caseSection = document.querySelector('.case-study-section')
    document.querySelectorAll('.sr-cms-case').forEach((n) => n.remove())

    if (caseSection && projects.length) {
      caseSection.querySelectorAll('.case--study-spacing:not(.sr-cms-case)').forEach((n) => {
        n.style.display = 'none'
        n.setAttribute('data-sr-replaced', 'true')
      })
    }

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

    const list = document.querySelector('.collection-list-4.w-dyn-items')
    document.querySelectorAll('.sr-cms-chip').forEach((n) => n.remove())
    if (list) {
      list.querySelectorAll('.w-dyn-item:not(.sr-cms-chip)').forEach((n) => {
        n.style.display = 'none'
        n.setAttribute('data-sr-replaced', 'true')
      })
      projects.forEach((project) => list.appendChild(buildAllCaseChip(project)))
    }

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
