/**
 * Checkout success/cancel URLs must never come from request Host headers.
 * @returns {string}
 */
export function getTrustedAppUrl() {
  const configured = typeof process.env.APP_URL === 'string' ? process.env.APP_URL.trim().replace(/\/$/, '') : ''
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured
  }
  if (process.env.VERCEL_ENV === 'preview' && typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, '')}`
  }
  if (!process.env.VERCEL) {
    return 'http://localhost:5173'
  }
  return configured || 'http://localhost:5173'
}

export function isLocalDev() {
  return !process.env.VERCEL && process.env.NODE_ENV !== 'production'
}
