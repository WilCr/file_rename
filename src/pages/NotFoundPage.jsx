import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import SiteChrome from '../components/SiteChrome'

export default function NotFoundPage() {
  return (
    <SiteChrome>
      <Seo
        title="Page not found | AI File Renamer"
        description="That page does not exist. Return to AI File Renamer to rename files in your browser."
        path="/"
        noindex
      />
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">
          That URL is not a page on this site.{' '}
          <Link to="/" className="text-violet-600 underline hover:text-violet-500">
            Go to the app
          </Link>
          .
        </p>
      </section>
    </SiteChrome>
  )
}
