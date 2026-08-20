import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLANS, paidPlansReady } from '../../data/plans'
import { redirectToCheckout } from '../../services/stripe'

/**
 * @param {{ requireSignInPath?: string }} [props]
 */
export default function PlanGrid({ requireSignInPath = '/?signin=1' }) {
  const navigate = useNavigate()
  const [busyId, setBusyId] = useState(null)

  const handleUpgrade = async (priceId) => {
    if (!priceId) return
    if (!localStorage.getItem('authToken')) {
      navigate(requireSignInPath)
      return
    }
    setBusyId(priceId)
    try {
      await redirectToCheckout(priceId)
    } catch (e) {
      console.error(e)
      window.alert(e?.message || 'Checkout failed')
      setBusyId(null)
    }
  }

  const signedIn = Boolean(
    typeof localStorage !== 'undefined' && localStorage.getItem('authToken'),
  )

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => {
        const isFree = plan.priceId === null && plan.name === 'Free'
        const canUpgrade = Boolean(plan.priceId) && paidPlansReady
        let buttonLabel = 'Coming soon'
        if (isFree) buttonLabel = 'Included on the free plan'
        else if (canUpgrade && !signedIn) buttonLabel = 'Sign in to upgrade'
        else if (canUpgrade) buttonLabel = busyId === plan.priceId ? 'Redirecting…' : 'Upgrade now'

        return (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.popular ? 'border-violet-500 ring-2 ring-violet-200' : 'border-slate-200'
            }`}
          >
            {plan.popular && (
              <div className="mb-2 inline-block rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {plan.price}
              <span className="text-base font-normal text-slate-500">/mo</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{plan.credits}</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleUpgrade(plan.priceId)}
              disabled={!canUpgrade || Boolean(busyId)}
              className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-all ${
                canUpgrade
                  ? 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60'
                  : 'cursor-default bg-slate-100 text-slate-500'
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        )
      })}
    </div>
  )
}
