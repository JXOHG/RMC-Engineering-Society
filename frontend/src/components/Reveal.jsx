import useReveal from '../hooks/useReveal'

/**
 * Fades and slides content up into place the first time it scrolls
 * into view. `as` picks the wrapper tag, `delay` (ms) staggers a
 * group of items, and `className` is merged onto the wrapper so this
 * can drop in anywhere a plain <div> would go.
 */
export default function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }) {
  const [ref, visible] = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  )
}
