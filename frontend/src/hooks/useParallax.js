import { useEffect, useRef, useState } from 'react'

/**
 * Ties an element's vertical position to scroll position for a cheap,
 * GPU-friendly parallax drift. `speed` is how much of the element's
 * distance from the viewport centre gets applied as an offset -- small
 * values (0.05 - 0.2) read as a subtle drift rather than a distracting
 * bounce. `clamp` caps the maximum offset so fast scrolling or very
 * tall pages never push the element far enough to reveal a seam.
 *
 * Skips all work when the API isn't available or the user has asked
 * for reduced motion, so it degrades to a static element rather than
 * throwing or animating against someone's preference.
 */
export default function useParallax(speed = 0.1, clamp = 48) {
  const ref = useRef(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false

    function update() {
      const rect = node.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const elementCenter = rect.top + rect.height / 2
      const raw = (elementCenter - viewportCenter) * speed
      setOffset(Math.max(-clamp, Math.min(clamp, raw)))
      ticking = false
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [speed, clamp])

  return [ref, offset]
}
