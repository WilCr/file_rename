import Stripe from 'stripe'
import { getUserFromRequest, publicUser } from '../../lib/server/auth.js'
import { getJsonBody } from '../../lib/server/parseBody.js'
import { fulfillSubscription } from '../../lib/server/fulfillSubscription.js'
import { getUsageState } from '../../lib/server/usage.js'
import { prisma } from '../../lib/server/prisma.js'

/**
 * Completes a paid Checkout Session for the signed-in user.
 * Used when returning from Stripe so the plan updates even if the webhook is late or missing.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = typeof process.env.STRIPE_SECRET_KEY === 'string' ? process.env.STRIPE_SECRET_KEY.trim() : ''
  if (!secret || !/^sk_(test|live)_/.test(secret)) {
    return res.status(503).json({ error: 'Stripe is not configured' })
  }

  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { sessionId } = getJsonBody(req)
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' })
    }

    const stripe = new Stripe(secret)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const sessionUserId = session.client_reference_id || session.metadata?.userId
    if (sessionUserId !== user.id) {
      return res.status(403).json({ error: 'This checkout session belongs to a different account.' })
    }

    if (session.mode !== 'subscription') {
      return res.status(400).json({ error: 'Not a subscription checkout session.' })
    }

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return res.status(402).json({ error: 'Payment is not complete yet. Try again in a moment.' })
    }

    const customerId = session.customer
    const subscriptionId = session.subscription
    if (typeof customerId !== 'string' || typeof subscriptionId !== 'string') {
      return res.status(502).json({ error: 'Checkout session is missing subscription details.' })
    }

    const wasFree = !user.subscriptionTier || user.subscriptionTier === 'free'
    const result = await fulfillSubscription(prisma, stripe, {
      userId: user.id,
      customerId,
      subscriptionId,
      resetUsage: wasFree,
    })

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const usage = await getUsageState(prisma, user.id, updated)

    return res.status(200).json({
      ok: true,
      tier: result.tier,
      status: result.status,
      user: publicUser(updated),
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        month: usage.month,
      },
    })
  } catch (err) {
    console.error('confirm-checkout:', err)
    const message = typeof err?.message === 'string' ? err.message : ''
    if (err?.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: message.slice(0, 200) || 'Invalid checkout session' })
    }
    return res.status(500).json({ error: 'Could not confirm checkout' })
  }
}
