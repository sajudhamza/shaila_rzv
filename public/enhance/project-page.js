/* Project page: horizontal Journal slider */
(function () {
  'use strict'

  function initJournalSlider(root) {
    const slider = root.querySelector('[data-journal-slider]')
    if (!slider) return

    const track = slider.querySelector('.srp-journal-track')
    const items = [...slider.querySelectorAll('.srp-journal-item')]
    if (!track || !items.length) return

    const prev = root.querySelector('[data-journal-prev]')
    const next = root.querySelector('[data-journal-next]')

    const step = () => {
      const first = items[0]
      if (!first) return slider.clientWidth * 0.85
      const gap = parseFloat(getComputedStyle(track).gap) || 16
      return first.getBoundingClientRect().width + gap
    }

    const scrollByDir = (dir) => {
      slider.scrollBy({ left: dir * step(), behavior: 'smooth' })
    }

    prev?.addEventListener('click', () => scrollByDir(-1))
    next?.addEventListener('click', () => scrollByDir(1))

    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollByDir(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollByDir(1)
      }
    })

    // Drag to scroll
    let dragging = false
    let startX = 0
    let startScroll = 0

    const onPointerDown = (e) => {
      dragging = true
      startX = e.clientX
      startScroll = slider.scrollLeft
      slider.setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e) => {
      if (!dragging) return
      slider.scrollLeft = startScroll - (e.clientX - startX)
    }
    const onPointerUp = () => {
      dragging = false
    }

    slider.addEventListener('pointerdown', onPointerDown)
    slider.addEventListener('pointermove', onPointerMove)
    slider.addEventListener('pointerup', onPointerUp)
    slider.addEventListener('pointercancel', onPointerUp)
  }

  function boot() {
    document.querySelectorAll('.srp-journal').forEach(initJournalSlider)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
