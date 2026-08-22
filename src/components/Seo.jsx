import { useEffect } from 'react'
import { SITE_NAME, SITE_ORIGIN } from '../lib/site'

/**
 * @param {string} attr
 * @param {string} key
 * @param {string} content
 */
function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * @param {string} rel
 * @param {string} href
 */
function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${CSS.escape(rel)}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Sets document title, description, canonical, and Open Graph tags for the current route.
 *
 * @param {{ title: string, description: string, path: string, noindex?: boolean }} props
 */
export default function Seo({ title, description, path, noindex = false }) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path === '/' ? '/' : path}`
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    if (!noindex) {
      upsertLink('canonical', url)
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove()
    }
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', noindex ? SITE_ORIGIN + '/' : url)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('name', 'twitter:card', 'summary')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
  }, [title, description, path, noindex])

  return null
}
