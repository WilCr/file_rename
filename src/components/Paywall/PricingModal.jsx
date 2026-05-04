import { redirectToCheckout } from '../../services/stripe'

const PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO || ''
const PRICE_BUSINESS = import.meta.env.VITE_STRIPE_PRICE_BUSINESS || ''

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export default function PricingModal({ isOpen, onClose }) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      credits: '10 renames / month',
      features: [
        '10 AI-powered renames per month',
        'Basic pattern renaming',
        'Owner name labeling',
      ],
      priceId: null,
    },
    {
      name: 'Pro',
      price: '$9.99',
      credits: '500 renames / month',
      features: [
        '500 AI-powered renames per month',
        'All pattern options',
        'Priority processing',
        'Batch operations',
      ],
      priceId: PRICE_PRO || null,
      popular: true,
    },
    {
      name: 'Business',
      price: '$29.99',
      credits: 'Unlimited',
      features: [
        'Unlimited AI-powered renames',
        'Team collaboration',
        'API access',
        'Priority support',
      ],
      priceId: PRICE_BUSINESS || null,
    },
  ]

  const handleUpgrade = async (priceId) => {
    if (!priceId) return
    try {
      await redirectToCheckout(priceId)
    } catch (e) {
      console.error(e)
      window.alert(e?.message || 'Checkout failed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Choose your plan</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">VITE_STRIPE_PRICE_PRO</code> and{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">VITE_STRIPE_PRICE_BUSINESS</code> in your env
          to enable paid plans.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-xl p-6 ${
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
              <div className="mt-2 text-sm text-slate-600">{plan.credits}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
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
                disabled={!plan.priceId}
                className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-all ${
                  plan.priceId
                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                    : 'cursor-default bg-slate-100 text-slate-500'
                }`}
              >
                {plan.priceId ? 'Upgrade now' : 'Current plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
