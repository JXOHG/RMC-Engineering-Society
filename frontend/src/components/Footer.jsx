import gearLeaf from '../assets/gear-leaf-logo.png'
import crest from '../assets/rmc-crest.png'

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="container-page py-8 sm:py-10 flex flex-col sm:flex-row items-center text-center sm:text-left justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src={gearLeaf} alt="" className="h-8 w-8 object-contain opacity-90 shrink-0" />
          <p className="text-sm text-steel">
            RMC Engineering Society &mdash; built by and for the cadet wing.
          </p>
        </div>

        <a
          href="https://www.rmc-cmr.ca/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 shrink-0"
        >
          <img
            src={crest}
            alt="Royal Military College of Canada"
            className="h-9 w-9 object-contain opacity-90 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="text-xs font-semibold tracking-wide text-steel transition-colors group-hover:text-cardinal-600">
            rmc-cmr.ca &rarr;
          </span>
        </a>
      </div>

      <div className="border-t border-ink/5">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center">
          <p className="text-xs text-steel/70">
            &copy; {new Date().getFullYear()} Royal Military College of Canada.
          </p>
          <span className="hidden sm:inline text-steel/30" aria-hidden="true">
            &middot;
          </span>
          <p className="text-[11px] tracking-wide text-steel/50">Developed by OCdt Oh 31694</p>
        </div>
      </div>
    </footer>
  )
}
