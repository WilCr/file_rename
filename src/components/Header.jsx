import { ExternalLink, LogIn, LogOut, UserPlus } from 'lucide-react'

const CURVEDSPACE_URL = 'https://curvedspace.us/'

/**
 * @param {{
 *   user: { email: string, subscriptionTier?: string, billingPortalAvailable?: boolean } | null,
 *   onSignIn: () => void,
 *   onSignUp: () => void,
 *   onSignOut: () => void,
 *   onManageBilling: () => void,
 *   onOpenPricing: () => void,
 * }} props
 */
export function Header({ user, onSignIn, onSignUp, onSignOut, onManageBilling, onOpenPricing }) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          AI File Renamer
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:mx-0 sm:text-lg">
          Drop files, get smart names from Claude, add optional owner labels, then download everything with one click —
          all in your browser.
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end sm:pt-1">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {user ? (
            <>
              <span className="max-w-[220px] truncate rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700" title={user.email}>
                {user.email}
              </span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium uppercase text-violet-800">
                {user.subscriptionTier || 'free'}
              </span>
              <button
                type="button"
                onClick={onOpenPricing}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Pricing
              </button>
              {user.billingPortalAvailable && (
                <button
                  type="button"
                  onClick={onManageBilling}
                  className="inline-flex min-h-[40px] items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Billing
                </button>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Sign in
              </button>
              <button
                type="button"
                onClick={onSignUp}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Sign up
              </button>
            </>
          )}
        </div>

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
