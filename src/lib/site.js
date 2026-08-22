/** Canonical origin used in sitemap, robots, and meta tags. */
export const SITE_ORIGIN = (
  import.meta.env.VITE_APP_URL || 'https://scanrename.com'
).replace(/\/$/, '')

export const SITE_NAME = 'ScanRename'

export const SITE_DESCRIPTOR = 'AI file renamer for PDFs and scans'

export const HOME_TITLE = `${SITE_NAME} | ${SITE_DESCRIPTOR}`

export const DEFAULT_DESCRIPTION =
  'ScanRename is an AI file renamer for PDFs, Word documents, and images. Pattern renaming stays on your device. Optional AI suggest proposes names from the file contents.'
