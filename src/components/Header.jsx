import { ExternalLink } from 'lucide-react'

const CURVEDSPACE_URL = 'https://curvedspace.us/'

export function Header() {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          AI File Renamer
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:mx-0 sm:text-lg">
          Drop files, get smart names from Claude, add optional owner labels, then download
          everything with one click — all in your browser.
        </p>
      </div>

      <div className="flex shrink-0 justify-center sm:justify-end sm:pt-1">
        <a
          href={CURVEDSPACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          aria-label="CurvedSpace Investment — opens curvedspace.us in a new tab"
        >
          <ExternalLink className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
          CurvedSpace Investment
        </a>
      </div>
    </header>
  )
}
