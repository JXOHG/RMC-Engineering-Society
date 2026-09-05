import { useEffect, useRef, useState } from 'react'

/**
 * Flags an element as "visible" the first time it scrolls into view,
 * so it can be paired with a CSS transition for a fade/slide-in
 * reveal. Uses IntersectionObserver so it stays cheap even with many
 * items on a page, and unobserves itself once triggered.
 *
 * Falls back to immediately visible when IntersectionObserver isn't
 * available or the user prefers reduced motion, so content is never
 * hidden waiting on an effect that isn't going to run.
 */
export default function useReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(node)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, visible]
}
