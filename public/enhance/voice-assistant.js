/* Shaila Rizvi Design Guide voice assistant */
(function () {
  'use strict'

  const SITE = {
    name: 'Shaila Rizvi',
    short: 'Design Guide',
    subtitle: 'Interiors · case studies · contact',
    launcher: 'Ask Shaila',
    welcome:
      "Hello. I'm your design guide for Shaila Rizvi's studio. Ask about her work, case studies like Bungalow or GupShup, or how to get in touch.",
    prompts: ['Who is Shaila?', 'Bungalow', 'Case studies', 'Contact', 'GupShup'],
    about:
      'Shaila Rizvi is a New York based interior designer. She blends elegance and purpose, crafting spaces with contemporary comfort and exclusive aesthetics. She holds a Master\'s in Interior Design from Parsons School of Design, and pairs space conceptualization with strong project management.',
    philosophy:
      'Shaila creates wonderful spaces for people to dwell, work, and socialize: personalized, custom design solutions for restaurants, homes, and immersive environments.',
    contact:
      'Reach Shaila at Shaila@bungalowny.com or 201-478-2333. The studio address is 10 River Road, NY, NY- 10044.',
    address: '10 River Road, NY, NY- 10044',
    phone: '201-478-2333',
    email: 'Shaila@bungalowny.com',
    studies: {
      bungalow: {
        path: '/desing-cms/bungalow/',
        blurb:
          'Bungalow in NYC\'s East Village is a luxe retreat inspired by vintage Indian upscale living: jewel tones, custom brass and teak, and an immersive bungalow atmosphere.',
      },
      'chote miya': {
        path: '/desing-cms/chote-miya/',
        blurb:
          'Chote Miya is a vibrant tribute to 90s India, blending street flavors with nostalgic ambiance in New York City.',
      },
      gupshup: {
        path: '/desing-cms/gupshup/',
        blurb:
          'GupShup (Bombay House) in Gramercy Park evokes 1970s Bombay: jewel-toned textiles, vintage glamour, and eclectic décor sourced from India.',
      },
      ammi: {
        path: '/desing-cms/ammi/',
        blurb:
          'Ammi at Pier 57 celebrates homestyle Indian cuisine with marigold accents, an orange-and-green palette, and an open kitchen for immersive dining.',
      },
      movie: {
        path: '/desing-cms/movie/',
        aliases: ['zindagi', 'kashmakash', 'film', 'set design'],
        blurb:
          'Zindagi Kashmakash is set design crafted to match the film\'s narrative, era, and style with visually compelling interiors.',
      },
    },
  }

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\s&']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const includesAny = (text, phrases) => phrases.some((p) => text.includes(p))

  function matchStudy(text) {
    for (const [key, study] of Object.entries(SITE.studies)) {
      const names = [key, ...(study.aliases || [])]
      if (names.some((n) => text.includes(n))) return { key, ...study }
    }
    return null
  }

  function resolveIntent(raw) {
    const text = normalize(raw)
    if (!text) {
      return { message: 'Ask about Shaila, a case study, or how to get in touch.', path: null }
    }

    if (includesAny(text, ['hello', 'hi ', 'hey', 'good evening', 'good afternoon'])) {
      return { message: SITE.welcome, path: null }
    }

    if (includesAny(text, ['help', 'what can you do', 'what do you know'])) {
      return {
        message:
          'I can introduce Shaila, walk you through case studies: Bungalow, Chote Miya, GupShup, Ammi, and Zindagi Kashmakash, or share contact details.',
        path: null,
      }
    }

    if (includesAny(text, ['contact', 'email', 'phone', 'call', 'reach', 'get in touch', 'enquire', 'inquiry'])) {
      return {
        message: SITE.contact + ' I\'ll take you to the contact section.',
        path: '/#get-in-touch',
      }
    }

    if (includesAny(text, ['address', 'where', 'location', 'studio', 'office'])) {
      return {
        message: `The studio is at ${SITE.address}. Phone ${SITE.phone}, email ${SITE.email}.`,
        path: '/#get-in-touch',
      }
    }

    const study = matchStudy(text)
    if (study) {
      return {
        message: study.blurb + ' Opening that case study now.',
        path: study.path,
      }
    }

    if (includesAny(text, ['case study', 'case studies', 'portfolio', 'projects', 'work', 'restaurant'])) {
      return {
        message:
          'Featured case studies include Bungalow, Chote Miya, GupShup, Ammi, and Zindagi Kashmakash. Ask for any one by name, or browse the home page.',
        path: '/#case-studies',
      }
    }

    if (
      includesAny(text, [
        'who is',
        'about',
        'shaila',
        'designer',
        'parsons',
        'background',
        'bio',
        'introduce',
      ])
    ) {
      return { message: SITE.about, path: '/#about' }
    }

    if (includesAny(text, ['philosophy', 'approach', 'style', 'spaces', 'dwell'])) {
      return { message: SITE.philosophy, path: '/#about' }
    }

    if (includesAny(text, ['home', 'homepage', 'start'])) {
      return { message: 'Taking you to the homepage.', path: '/' }
    }

    if (includesAny(text, ['career', 'job', 'hire', 'work with', 'collaborate'])) {
      return {
        message:
          'For collaborations or career inquiries, email Shaila@bungalowny.com or call 201-478-2333.',
        path: '/#get-in-touch',
      }
    }

    return {
      message:
        "I'm not sure about that. Try asking who Shaila is, about Bungalow or GupShup, or say contact.",
      path: null,
    }
  }

  function pickSoftVoice() {
    const voices = window.speechSynthesis.getVoices() || []
    const en = voices.filter((v) => /^en(-|_)/i.test(v.lang) || /^en$/i.test(v.lang))
    const pool = en.length ? en : voices

    // Prefer calm / premium female-leaning voices; avoid harsh defaults
    const ranked = [
      /Samantha/i,
      /Ava/i,
      /Allison/i,
      /Microsoft Aria/i,
      /Microsoft Jenny/i,
      /Google UK English Female/i,
      /Serena/i,
      /Moira/i,
      /Fiona/i,
      /Karen/i,
      /Victoria/i,
      /Susan/i,
      /Emma/i,
      /Zira/i,
      /Natural/i,
      /Premium/i,
      /Enhanced/i,
      /Female/i,
    ]

    for (const re of ranked) {
      const match = pool.find((v) => re.test(v.name))
      if (match) return match
    }
    return pool.find((v) => !/Daniel|Alex|Fred|David|Mark|Tom|Male|Rishi/i.test(v.name)) || pool[0] || null
  }

  function speak(text, onEnd) {
    if (!window.speechSynthesis) {
      onEnd && onEnd()
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    // Soft, unhurried delivery
    u.rate = 0.82
    u.pitch = 1.12
    u.volume = 0.78
    const preferred = pickSoftVoice()
    if (preferred) u.voice = preferred
    u.onend = () => onEnd && onEnd()
    u.onerror = () => onEnd && onEnd()
    // Brief delay helps some browsers apply the chosen voice
    window.setTimeout(() => window.speechSynthesis.speak(u), 40)
  }

  function stopSpeak() {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }

  function navigate(path) {
    if (!path) return
    if (path.startsWith('/#')) {
      const hash = path.slice(1)
      if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
        const el =
          document.querySelector(hash) ||
          document.querySelector('[id*="contact"], .get-in-touch, section:last-of-type')
        if (hash === '#get-in-touch') {
          const contact =
            document.querySelector('h1') &&
            [...document.querySelectorAll('h1')].find((h) =>
              /get in touch/i.test(h.textContent || ''),
            )
          if (contact) {
            contact.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
          }
        }
        if (hash === '#about') {
          const about = [...document.querySelectorAll('h5, h1')].find((h) =>
            /about|introducing/i.test(h.textContent || ''),
          )
          if (about) {
            about.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
          }
        }
        if (hash === '#case-studies') {
          const cs = [...document.querySelectorAll('h3, h6')].find((h) =>
            /bungalow|case study/i.test(h.textContent || ''),
          )
          if (cs) {
            cs.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return
          }
        }
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.location.assign(path.replace('/#', '/#'))
        return
      }
      window.location.assign('/' + path)
      return
    }
    window.location.assign(path)
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
  const voiceSupported = Boolean(SpeechRecognitionCtor)

  function micSvg(live) {
    if (live) {
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" stroke-width="2"/><path d="M12 18v3" stroke="currentColor" stroke-width="2"/></svg>`
    }
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" stroke-width="2"/><path d="M12 18v3" stroke="currentColor" stroke-width="2"/></svg>`
  }

  function mount() {
    if (document.getElementById('sr-voice-root')) return

    const root = document.createElement('div')
    root.id = 'sr-voice-root'
    root.className = 'sr-voice-root'
    root.innerHTML = `
      <button type="button" class="sr-voice-launcher" aria-label="Open ${SITE.short}">
        <span class="sr-voice-launcher__orb" aria-hidden="true"></span>
        <span class="sr-voice-launcher__label">${SITE.launcher}</span>
      </button>
      <div class="sr-voice-panel" hidden role="dialog" aria-label="${SITE.short}">
        <div class="sr-voice-header">
          <div class="sr-voice-brand">
            <p class="sr-voice-kicker">Shaila Rizvi</p>
            <p class="sr-voice-title">${SITE.short}</p>
            <p class="sr-voice-sub">${SITE.subtitle}</p>
          </div>
          <button type="button" class="sr-voice-close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.4"/>
            </svg>
          </button>
        </div>
        <div class="sr-voice-messages"></div>
        ${
          voiceSupported
            ? ''
            : '<p class="sr-voice-warn">Voice works best in Chrome or Edge. You can still type below.</p>'
        }
        <div class="sr-voice-footer">
          <div class="sr-voice-prompts"></div>
          <form class="sr-voice-form">
            <input type="text" class="sr-voice-input" placeholder="Ask about a project…" autocomplete="off" />
            <button type="submit" class="sr-voice-send">Send</button>
          </form>
          <div class="sr-voice-status-row">
            <p class="sr-voice-status">Tap the mic to speak</p>
            <button type="button" class="sr-voice-mic" aria-label="Start listening">${micSvg(false)}</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(root)

    const launcher = root.querySelector('.sr-voice-launcher')
    const panel = root.querySelector('.sr-voice-panel')
    const closeBtn = root.querySelector('.sr-voice-close')
    const messagesEl = root.querySelector('.sr-voice-messages')
    const promptsEl = root.querySelector('.sr-voice-prompts')
    const form = root.querySelector('.sr-voice-form')
    const input = root.querySelector('.sr-voice-input')
    const statusEl = root.querySelector('.sr-voice-status')
    const micBtn = root.querySelector('.sr-voice-mic')

    SITE.prompts.forEach((prompt) => {
      const chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'sr-voice-chip'
      chip.textContent = prompt
      chip.addEventListener('click', () => handleInput(prompt))
      promptsEl.appendChild(chip)
    })

    let busy = false
    let recognition = null

    function addMessage(role, text) {
      const row = document.createElement('div')
      row.className = 'sr-voice-row sr-voice-row--' + role
      const bubble = document.createElement('div')
      bubble.className = 'sr-voice-bubble sr-voice-bubble--' + role
      bubble.textContent = text
      row.appendChild(bubble)
      messagesEl.appendChild(row)
      messagesEl.scrollTop = messagesEl.scrollHeight
    }

    function setStatus(label) {
      statusEl.textContent = label
    }

    function handleInput(raw) {
      const text = String(raw || '').trim()
      if (!text) return

      // Allow interrupting speech / previous turn
      stopSpeak()
      if (recognition) {
        try {
          recognition.stop()
        } catch (_) {}
        recognition = null
        micBtn.classList.remove('sr-voice-mic--live')
      }

      busy = true
      setStatus('Thinking…')
      addMessage('user', text)

      const { message, path } = resolveIntent(text)
      if (path) {
        window.setTimeout(() => navigate(path), 1100)
      }

      addMessage('assistant', message)
      setStatus('Speaking…')
      speak(message, () => {
        setStatus(voiceSupported ? 'Tap the mic to speak' : 'Type your question below')
        busy = false
      })
    }

    function openPanel() {
      panel.hidden = false
      launcher.hidden = true
      setStatus(voiceSupported ? 'Tap the mic to speak' : 'Type your question below')
    }

    function closePanel() {
      stopSpeak()
      if (recognition) {
        try {
          recognition.stop()
        } catch (_) {}
        recognition = null
      }
      panel.hidden = true
      launcher.hidden = false
      micBtn.classList.remove('sr-voice-mic--live')
      setStatus(voiceSupported ? 'Tap the mic to speak' : 'Type your question below')
      busy = false
    }

    launcher.addEventListener('click', openPanel)
    closeBtn.addEventListener('click', closePanel)

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const v = input.value.trim()
      if (!v) return
      input.value = ''
      handleInput(v)
    })

    micBtn.addEventListener('click', () => {
      if (!voiceSupported) {
        addMessage(
          'assistant',
          'Voice input is not supported in this browser. Please type your question.',
        )
        return
      }
      if (micBtn.classList.contains('sr-voice-mic--live')) {
        try {
          recognition && recognition.stop()
        } catch (_) {}
        micBtn.classList.remove('sr-voice-mic--live')
        setStatus('Tap the mic to speak')
        return
      }

      stopSpeak()
      recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.onstart = () => {
        micBtn.classList.add('sr-voice-mic--live')
        setStatus('Listening…')
      }
      recognition.onresult = (event) => {
        micBtn.classList.remove('sr-voice-mic--live')
        const transcript =
          event.results[0] && event.results[0][0] && event.results[0][0].transcript
        if (transcript) handleInput(transcript)
        else setStatus('Tap the mic to speak')
      }
      recognition.onerror = () => {
        micBtn.classList.remove('sr-voice-mic--live')
        setStatus('Tap the mic to speak')
      }
      recognition.onend = () => {
        micBtn.classList.remove('sr-voice-mic--live')
      }
      try {
        recognition.start()
      } catch (_) {
        setStatus('Tap the mic to speak')
      }
    })

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
})()
