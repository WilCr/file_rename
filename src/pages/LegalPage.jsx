import Markdown from '../components/Markdown'
import Seo from '../components/Seo'
import SiteChrome from '../components/SiteChrome'

/**
 * @param {{
 *   source: string,
 *   title: string,
 *   description: string,
 *   path: string,
 * }} props
 */
export default function LegalPage({ source, title, description, path }) {
  return (
    <SiteChrome>
      <Seo title={title} description={description} path={path} />
      <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Markdown source={source} />
      </article>
    </SiteChrome>
  )
}
