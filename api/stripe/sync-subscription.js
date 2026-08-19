import Stripe from 'stripe'
import { getUserFromRequest, publicUser } from '../../lib/server/auth.js'
import { fulfillSubscription } from '../../lib/server/fulfillSubscription.js'
import { getUsageState } from '../../lib/server/usage.js'
import { prisma } from '../../lib/server/prisma.js'
import { consumeRateLimit, tooManyRequests } from '../../lib/server/rateLimit.js'

/**
 * Recover a subscription that was created for THIS user (client_reference_id / metadata).
 * Email match alone is not enough — that would let someone squat a paid customer's address.
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

    const limited = await consumeRateLimit(`sync:user:${user.id}`, 10, 60 * 60 * 1000)
    if (!limited.ok) return tooManyRequests(res, limited.retryAfterSec)

    const stripe = new Stripe(secret)
    let customerId = user.stripeCustomerId
    let subscriptionId = user.stripeSubscriptionId

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 })
      for (const customer of customers.data) {
        const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 15 })
        const mine = sessions.data.find(
          (s) =>
            (s.client_reference_id === user.id || s.metadata?.userId === user.id) &&
            (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') &&
            typeof s.subscription === 'string',
        )
        if (mine && typeof mine.customer === 'string' && typeof mine.subscription === 'string') {
          customerId = mine.customer
          subscriptionId = mine.subscription
          break
        }
      }
    }

    if (!customerId) {
      return res.status(404).json({
        error: 'No active Stripe subscription found for this account.',
        code: 'NO_SUBSCRIPTION',
      })
    }

    if (!subscriptionId) {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 5,
      })
      const active = subs.data.find((s) => s.status === 'active' || s.status === 'trialing')
      if (!active) {
        return res.status(404).json({
          error: 'No active Stripe subscription found for this account.',
          code: 'NO_SUBSCRIPTION',
        })
      }
      subscriptionId = active.id
    }

    const wasFree = user.subscriptionTier === 'free'
    await fulfillSubscription(prisma, stripe, {
      userId: user.id,
      customerId,
      subscriptionId,
      resetUsage: wasFree,
    })

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const usage = await getUsageState(prisma, user.id, updated)

    return res.status(200).json({
      ok: true,
      tier: updated.subscriptionTier,
      status: updated.subscriptionStatus,
      user: publicUser(updated),
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        month: usage.month,
      },
    })
  } catch (err) {
    console.error('sync-subscription:', err)
    return res.status(500).json({ error: 'Could not sync subscription' })
  }
}
