function envPrice(name) {
  const v = process.env[name]
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * @param {string | undefined} priceId
 * @returns {'free' | 'pro' | 'business'}
 */
export function tierFromPriceId(priceId) {
  if (!priceId) return 'free'
  const id = priceId.trim()
  if (id && id === envPrice('STRIPE_PRICE_PRO')) return 'pro'
  if (id && id === envPrice('STRIPE_PRICE_BUSINESS')) return 'business'
  return 'free'
}

/**
 * @param {string | undefined} priceId
 */
export function isAllowedCheckoutPriceId(priceId) {
  if (!priceId) return false
  const id = priceId.trim()
  const allowed = [envPrice('STRIPE_PRICE_PRO'), envPrice('STRIPE_PRICE_BUSINESS')].filter(Boolean)
  return allowed.includes(id)
}
