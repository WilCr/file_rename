/** Canonical origin used in sitemap, robots, and meta tags. */
export const SITE_ORIGIN = (
  import.meta.env.VITE_APP_URL || 'https://scanrename.com'
).replace(/\/$/, '')

export const SITE_NAME = 'AI File Renamer'

export const DEFAULT_DESCRIPTION =
  'Rename PDFs, Word documents, and images in your browser. Pattern renaming stays on your device. Optional AI suggest proposes names from the file contents.'
