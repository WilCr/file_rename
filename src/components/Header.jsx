import { ChevronUp, ExternalLink, LogIn, LogOut, UserPlus } from 'lucide-react'

const CURVEDSPACE_URL = 'https://curvedspace.us/'

const pill =
  'inline-flex min-h-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50'

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
    <header className="flex flex-wrap items-center justify-between gap-4 py-2 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm"
          aria-hidden
        >
          <ChevronUp className="h-5 w-5 stroke-[2.5]" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">AI File Renamer</span>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-2">
        <a href={CURVEDSPACE_URL} target="_blank" rel="noopener noreferrer" className={pill}>
          <span className="flex items-center gap-1.5">
            CurvedSpace
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </span>
        </a>

        {user ? (
          <>
            <span
              className="max-w-[140px] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:max-w-[200px]"
              title={user.email}
            >
              {user.email}
            </span>
            <button type="button" onClick={onOpenPricing} className={pill}>
              Plans
            </button>
            {user.billingPortalAvailable && (
              <button type="button" onClick={onManageBilling} className={pill}>
                Billing
              </button>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className={`${pill} gap-1.5 border-slate-300 bg-white`}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onSignIn} className={`${pill} gap-1.5`}>
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </button>
            <button
              type="button"
              onClick={onSignUp}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full border border-violet-500 bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Sign up
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
