/* Shaila Rizvi enhancement interactions */
(function () {
  'use strict'

  const READY_MS = 1600
  const FALLBACK_MS = 3200

  function markReady() {
    document.body.classList.add('sr-ready')
    const pre = document.querySelector('.preloder')
    if (pre) {
      pre.style.opacity = '0'
      pre.style.visibility = 'hidden'
      pre.style.pointerEvents = 'none'
      // Fully remove from layout after the fade so it cannot block the hero.
      setTimeout(() => {
        pre.style.display = 'none'
      }, 900)
    }
  }

  function prepareHeroImages() {
    document.querySelectorAll('.section.is-hero .hero-slider-img').forEach((img, i) => {
      img.loading = 'eager'
      img.decoding = 'async'
      img.fetchPriority = i === 0 ? 'high' : 'auto'
      // If a srcset candidate 404s in some hosts, fall back to the base src.
      img.addEventListener(
        'error',
        () => {
          if (img.dataset.srFallback) return
          img.dataset.srFallback = '1'
          img.removeAttribute('srcset')
          img.removeAttribute('sizes')
          if (img.getAttribute('src')) img.src = img.getAttribute('src')
        },
        { once: true },
      )
    })
  }

  function onLoad() {
    prepareHeroImages()

    // Hide preloader after animation window (or sooner if already gone)
    const pre = document.querySelector('.preloder')
    const start = performance.now()

    const tryReady = () => {
      const elapsed = performance.now() - start
      const hidden =
        !pre ||
        getComputedStyle(pre).display === 'none' ||
        getComputedStyle(pre).opacity === '0'
      if (hidden && elapsed >= 600) {
        markReady()
        return true
      }
      if (elapsed >= FALLBACK_MS) {
        markReady()
        return true
      }
      return false
    }

    if (!tryReady()) {
      const id = setInterval(() => {
        if (tryReady()) clearInterval(id)
      }, 120)
      setTimeout(markReady, READY_MS)
    }

    injectAtmosphere()
    setupReveals()
    setupScrollChrome()
    setupHeroParallax()
  }

  function injectAtmosphere() {
    if (document.querySelector('.sr-atmosphere')) return
    const grain = document.createElement('div')
    grain.className = 'sr-atmosphere'
    grain.setAttribute('aria-hidden', 'true')
    const vig = document.createElement('div')
    vig.className = 'sr-vignette'
    vig.setAttribute('aria-hidden', 'true')
    document.body.append(grain, vig)
  }

  function setupReveals() {
    const selectors = [
      '.about-content-wrappar',
      '.about-top-wrap',
      '.case--study-spacing',
      '.case-study-grid',
      '.case-study-one',
      '.case-study-box-wrappar',
      '.horijontle-scroling-section',
      '.paragraph-wrappar',
      '.left-content',
    ]

    const nodes = []
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (el.closest('.preloder') || el.closest('.navz-menut-open')) return
        el.classList.add('sr-reveal')
        if (i % 3 === 1) el.classList.add('sr-reveal-delay-1')
        if (i % 3 === 2) el.classList.add('sr-reveal-delay-2')
        nodes.push(el)
      })
    })

    if (!('IntersectionObserver' in window) || !nodes.length) {
      nodes.forEach((el) => el.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    nodes.forEach((el) => io.observe(el))
  }

  function setupScrollChrome() {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        document.body.classList.toggle('sr-scrolled', window.scrollY > 80)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  function setupHeroParallax() {
    const hero = document.querySelector('.section.is-hero')
    if (!hero) return
    const heading = hero.querySelector('.hero-heading-wrap')
    if (!heading) return

    // Soft parallax only while the hero is still mostly on screen.
    // Avoid opacity fades: Webflow scroll/IX can report odd scrollY values.
    let ticking = false
    const update = () => {
      ticking = false
      const rect = hero.getBoundingClientRect()
      const vh = window.innerHeight || 1
      if (rect.bottom <= 0 || rect.top >= vh) return
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)))
      heading.style.transform = `translate3d(0, ${progress * 48}px, 0)`
    }

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(update)
      },
      { passive: true },
    )
    update()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onLoad)
  } else {
    onLoad()
  }
})()
