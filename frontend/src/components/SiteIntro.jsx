import { useEffect, useState } from 'react'
import gearLeaf from '../assets/gear-leaf-logo.png'

// How long the gear spins before it starts fading, and how long the
// fade itself takes. Kept as constants so the two timers below and
// the CSS transition duration can never drift out of sync.
const SPIN_MS = 1400
const FADE_MS = 500

// A brief full-screen "loading" intro shown once when the site is
// first entered (i.e. on a hard page load, not on client-side route
// changes). The gear spins in place for a beat, then the whole
// overlay fades out to reveal the page underneath, which has already
// been mounting/loading behind it the entire time.
export default function SiteIntro() {
  const [stage, setStage] = useState('spinning') // 'spinning' | 'fading' | 'done'

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    // Respect reduced-motion the same way the rest of the site does:
    // skip the animation entirely and just show the content.
    if (prefersReducedMotion) {
      setStage('done')
      return
    }

    // Lock scrolling while the intro is up so the page can't jump
    // around underneath it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const fadeTimer = setTimeout(() => setStage('fading'), SPIN_MS)
    const doneTimer = setTimeout(() => {
      setStage('done')
      document.body.style.overflow = previousOverflow
    }, SPIN_MS + FADE_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  if (stage === 'done') return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-paper transition-opacity ${
        stage === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transitionDuration: `${FADE_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <img
        src={gearLeaf}
        alt=""
        className="h-16 w-16 sm:h-20 sm:w-20 object-contain animate-[spin_1.4s_linear_infinite] will-change-transform"
      />
    </div>
  )
}
