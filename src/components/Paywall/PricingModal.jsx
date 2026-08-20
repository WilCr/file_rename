import PlanGrid from './PlanGrid'
import { paidPlansReady } from '../../data/plans'

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export default function PricingModal({ isOpen, onClose }) {
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
          {paidPlansReady
            ? 'Upgrade for more AI renames each month. Cancel anytime from Manage billing.'
            : 'Paid checkout is not available yet. You can keep using the Free plan.'}
        </p>
        <div className="mt-8">
          <PlanGrid />
        </div>
      </div>
    </div>
  )
}
