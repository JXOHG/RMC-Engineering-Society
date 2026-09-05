import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import gearLeaf from '../assets/gear-leaf-logo.png'
import crest from '../assets/rmc-crest.png'

const linkClass = ({ isActive }) =>
  `text-sm font-semibold tracking-wide transition-colors ${
    isActive ? 'text-cardinal-600' : 'text-steel hover:text-cardinal-600'
  }`

const mobileLinkClass = ({ isActive }) =>
  `block py-3.5 text-base font-semibold tracking-wide transition-colors ${
    isActive ? 'text-cardinal-600' : 'text-ink hover:text-cardinal-600'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Tightens up and picks up a shadow once the page has scrolled a
  // little, so the sticky bar reads as "lifted" above the content
  // instead of just sitting flush against it the whole way down.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    closeMenu()
    logout()
  }

  return (
    <header
      className={`border-b-[3px] border-cardinal-600 bg-paper/95 backdrop-blur sticky top-0 z-30 transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_8px_24px_-12px_rgba(32,31,29,0.35)]' : 'shadow-none'
      }`}
    >
      <div
        className={`container-page flex items-center justify-between transition-[height] duration-300 ${
          scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
        }`}
      >
        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={closeMenu}>
          <img
            src={gearLeaf}
            alt=""
            className={`object-contain transition-all duration-300 ${
              scrolled ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-9 w-9 sm:h-11 sm:w-11'
            }`}
          />
          <span className="h-7 sm:h-8 w-px bg-steel/30" aria-hidden="true" />
          <img
            src={crest}
            alt="Royal Military College crest"
            className={`object-contain transition-all duration-300 ${
              scrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-11'
            }`}
          />
          <span className="hidden sm:flex flex-col leading-tight ml-1">
            <span className="font-display font-bold text-lg text-ink tracking-tight">
              Engineering Society
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-steel">
              Royal Military College
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>
            Dispatches
          </NavLink>
          <NavLink to="/team" className={linkClass}>
            Team
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events
          </NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                My dashboard
              </NavLink>
              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                  <NavLink to="/admin/archive" className={linkClass}>
                    Archive
                  </NavLink>
                </>
              )}
              <button
                onClick={logout}
                className="text-sm font-semibold text-steel hover:text-cardinal-600 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="bg-cardinal-600 text-paper text-sm font-semibold px-4 py-2 hover:bg-cardinal-700 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Member sign in
            </NavLink>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden -mr-2 flex h-11 w-11 items-center justify-center text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="h-6 w-6"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation panel */}
      <nav
        id="mobile-nav"
        className={`lg:hidden overflow-hidden border-t border-ink/10 bg-paper transition-[max-height] duration-300 ease-in-out ${
          menuOpen ? 'max-h-[28rem]' : 'max-h-0 border-t-0'
        }`}
      >
        <div className="container-page py-1 flex flex-col divide-y divide-ink/10">
          <NavLink to="/" end className={mobileLinkClass} onClick={closeMenu}>
            Dispatches
          </NavLink>
          <NavLink to="/team" className={mobileLinkClass} onClick={closeMenu}>
            Team
          </NavLink>
          <NavLink to="/events" className={mobileLinkClass} onClick={closeMenu}>
            Events
          </NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" className={mobileLinkClass} onClick={closeMenu}>
                My dashboard
              </NavLink>
              {user.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={mobileLinkClass} onClick={closeMenu}>
                    Admin
                  </NavLink>
                  <NavLink to="/admin/archive" className={mobileLinkClass} onClick={closeMenu}>
                    Archive
                  </NavLink>
                </>
              )}
              <button
                onClick={handleLogout}
                className="block py-3.5 text-base font-semibold text-steel hover:text-cardinal-600 transition-colors text-left"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              onClick={closeMenu}
              className="block py-3.5 text-base font-semibold text-cardinal-600"
            >
              Member sign in &rarr;
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}
