import useParallax from '../hooks/useParallax'

// Angular red facets referencing the Engineering Competition cover art.
// Drifts a little on scroll for a subtle parallax effect -- purely
// decorative, so it's hidden from assistive tech. The wrapper is
// taller than the section on both ends so the drift never reveals a
// seam at the top or bottom edge.
export default function HeroFacets() {
  const [ref, offset] = useParallax(0.1, 40)

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute -top-16 -bottom-16 right-0 w-[34%] sm:w-[40%] md:w-[52%] overflow-hidden will-change-transform"
      style={{ transform: `translate3d(0, ${offset}px, 0)` }}
    >
      <svg
        viewBox="0 0 900 620"
        preserveAspectRatio="xMaxYMid slice"
        className="h-full w-full"
      >
        <polygon points="900,0 900,620 520,620" fill="#B3212C" />
        <polygon points="900,0 900,340 610,0" fill="#8F1A23" />
        <polygon points="900,340 900,620 700,620 610,0" fill="#D6323E" />
        <polygon points="900,620 520,620 700,620" fill="#5C1015" />
        <polygon points="700,620 900,340 900,620" fill="#201F1D" opacity="0.85" />
        <polygon points="520,620 610,0 700,620" fill="#FBF9F7" opacity="0.06" />
      </svg>
    </div>
  )
}
