import { ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteFooter from './SiteFooter'

const navLink =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50'

/**
 * Shared header and footer for public pages (privacy, terms, pricing).
 * @param {{ children: import('react').ReactNode, wide?: boolean }} props
 */
export default function SiteChrome({ children, wide = false }) {
  return (
    <div className="min-h-svh bg-[#f3f4f6] font-sans text-slate-900">
      <div
        className={`mx-auto px-4 pb-12 pt-6 sm:px-6 ${wide ? 'max-w-5xl' : 'max-w-3xl lg:max-w-4xl'}`}
      >
        <header className="flex flex-wrap items-center justify-between gap-4 py-2 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm"
              aria-hidden
            >
              <ChevronUp className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              ScanRename
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Page">
            <Link to="/" className={navLink}>
              App
            </Link>
            <Link to="/pricing" className={navLink}>
              Pricing
            </Link>
          </nav>
        </header>
        {children}
        <SiteFooter />
      </div>
    </div>
  )
}
