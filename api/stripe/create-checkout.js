import Stripe from 'stripe'
import { getUserFromRequest } from '../../lib/server/auth.js'
import { getJsonBody } from '../../lib/server/parseBody.js'
import { isAllowedCheckoutPriceId } from '../../lib/server/stripeTier.js'

function getStripeSecret() {
  const secret = typeof process.env.STRIPE_SECRET_KEY === 'string' ? process.env.STRIPE_SECRET_KEY.trim() : ''
  return secret || null
}

function isLikelyStripeSecret(secret) {
  return /^sk_(test|live)_/.test(secret)
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = getStripeSecret()
  if (!secret) {
    return res.status(503).json({
      error: 'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).',
      code: 'STRIPE_NOT_CONFIGURED',
    })
  }
  if (!isLikelyStripeSecret(secret)) {
    return res.status(503).json({
      error:
        'STRIPE_SECRET_KEY is not a valid Stripe secret key. It must start with sk_test_ or sk_live_ (from Stripe Dashboard → Developers → API keys).',
      code: 'STRIPE_BAD_SECRET',
    })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { priceId } = getJsonBody(req)
    if (!priceId || typeof priceId !== 'string' || !isAllowedCheckoutPriceId(priceId)) {
      return res.status(400).json({
        error:
          'Invalid or unconfigured price. Set STRIPE_PRICE_PRO / STRIPE_PRICE_BUSINESS on the server to match the VITE_STRIPE_PRICE_* values.',
        code: 'INVALID_PRICE',
      })
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const stripe = new Stripe(secret)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, '')}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl.replace(/\/$/, '')}/?checkout=canceled`,
      client_reference_id: user.id,
      metadata: { userId: user.id },
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),
    })

    return res.status(200).json({ sessionId: session.id })
  } catch (err) {
    console.error('create-checkout:', err)
    const type = err?.type
    const message = typeof err?.message === 'string' ? err.message : ''
    if (type === 'StripeAuthenticationError' || /Invalid API Key/i.test(message)) {
      return res.status(503).json({
        error: 'Stripe rejected the secret key. Check STRIPE_SECRET_KEY in Vercel.',
        code: 'STRIPE_AUTH_FAILED',
      })
    }
    if (type === 'StripeInvalidRequestError') {
      return res.status(502).json({
        error: message.slice(0, 240) || 'Stripe rejected the checkout request.',
        code: 'STRIPE_INVALID_REQUEST',
      })
    }
    return res.status(500).json({ error: 'Payment error' })
  }
}
