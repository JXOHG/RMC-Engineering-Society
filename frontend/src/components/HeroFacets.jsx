// Angular red facets referencing the Engineering Competition cover art.
// Purely decorative -- hidden from assistive tech.
export default function HeroFacets() {
  return (
    <svg
      viewBox="0 0 900 620"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      className="absolute inset-y-0 right-0 h-full w-[34%] sm:w-[40%] md:w-[52%]"
    >
      <polygon points="900,0 900,620 520,620" fill="#B3212C" />
      <polygon points="900,0 900,340 610,0" fill="#8F1A23" />
      <polygon points="900,340 900,620 700,620 610,0" fill="#D6323E" />
      <polygon points="900,620 520,620 700,620" fill="#5C1015" />
      <polygon points="700,620 900,340 900,620" fill="#201F1D" opacity="0.85" />
      <polygon points="520,620 610,0 700,620" fill="#FBF9F7" opacity="0.06" />
    </svg>
  )
}
