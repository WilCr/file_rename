import { loadStripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

/**
 * @param {string} priceId
 */
export async function redirectToCheckout(priceId) {
  if (!publishableKey) {
    throw new Error('Stripe is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).')
  }
  const stripe = await loadStripe(publishableKey)
  if (!stripe) {
    throw new Error('Could not load Stripe.')
  }

  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to upgrade.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not start checkout')
  }

  const { sessionId } = data
  if (!sessionId) {
    throw new Error('Invalid checkout response')
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) {
    throw new Error(error.message || 'Stripe redirect failed')
  }
}

export async function redirectToBillingPortal() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    throw new Error('Sign in to manage billing.')
  }

  const base = import.meta.env.VITE_API_URL || '/api'
  const response = await fetch(`${base}/stripe/portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Could not open billing portal')
  }

  if (data.url) {
    window.location.href = data.url
  }
}
