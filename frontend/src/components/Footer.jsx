import gearLeaf from '../assets/gear-leaf-logo.png'

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-24">
      <div className="container-page py-8 sm:py-10 flex flex-col sm:flex-row items-center text-center sm:text-left justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={gearLeaf} alt="" className="h-8 w-8 object-contain opacity-90 shrink-0" />
          <p className="text-sm text-steel">
            RMC Engineering Society &mdash; built by and for the cadet wing.
          </p>
        </div>
        <p className="text-xs text-steel/70">
          &copy; {new Date().getFullYear()} Royal Military College of Canada.
        </p>
      </div>
      <div className="border-t border-ink/5">
        <div className="container-page py-4 text-center">
          <p className="text-[11px] tracking-wide text-steel/50">Developed by OCdt Oh 31694</p>
        </div>
      </div>
    </footer>
  )
}
