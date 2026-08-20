import { Link } from 'react-router-dom'

/**
 * @param {{ showAppHints?: boolean }} props
 */
export default function SiteFooter({ showAppHints = false }) {
  const linkClass = 'text-violet-600 underline hover:text-violet-500'

  return (
    <footer className="mt-10 space-y-1 text-center text-xs text-slate-500">
      {showAppHints && (
        <p>
          Files stay in your browser, except when AI suggest sends them for analysis.
          Ctrl+Enter to download all.
        </p>
      )}
      <p className="space-x-3">
        <Link to="/privacy" className={linkClass}>
          Privacy note
        </Link>
        <Link to="/terms" className={linkClass}>
          Terms of Service
        </Link>
        <Link to="/pricing" className={linkClass}>
          Pricing
        </Link>
      </p>
    </footer>
  )
}
