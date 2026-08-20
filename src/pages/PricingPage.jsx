import { Link } from 'react-router-dom'
import PlanGrid from '../components/Paywall/PlanGrid'
import { paidPlansReady } from '../data/plans'
import Seo from '../components/Seo'
import SiteChrome from '../components/SiteChrome'

export default function PricingPage() {
  return (
    <SiteChrome wide>
      <Seo
        title="Pricing | AI File Renamer"
        description="Free plan includes 10 AI-powered file renames per month. Pro is 500 for $9.99. Business is 5,000 for $29.99. Pattern renaming is included on every plan."
        path="/pricing"
      />
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          Pricing for AI File Renamer
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Batch-rename PDFs, Word documents, and images in your browser. Naming patterns and owner
          labels stay on your device. Optional AI suggest reads the file and proposes a name — you
          review it before download. Unused AI renames do not roll over.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {paidPlansReady
            ? 'Cancel or change a paid plan anytime from Manage billing after you sign in.'
            : 'Paid checkout is not available yet. You can keep using the Free plan from the app.'}
        </p>
        <div className="mt-8">
          <PlanGrid />
        </div>
        <p className="mt-8 text-sm text-slate-600">
          Ready to try it?{' '}
          <Link to="/" className="text-violet-600 underline hover:text-violet-500">
            Open the app
          </Link>
          .
        </p>
      </section>
    </SiteChrome>
  )
}
