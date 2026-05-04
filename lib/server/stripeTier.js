/**
 * @param {string | undefined} priceId
 * @returns {'free' | 'pro' | 'business'}
 */
export function tierFromPriceId(priceId) {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro'
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business'
  return 'free'
}

/**
 * @param {string | undefined} priceId
 */
export function isAllowedCheckoutPriceId(priceId) {
  if (!priceId) return false
  const allowed = [process.env.STRIPE_PRICE_PRO, process.env.STRIPE_PRICE_BUSINESS].filter(Boolean)
  return allowed.includes(priceId)
}
