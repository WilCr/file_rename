import Stripe from 'stripe'
import { getUserFromRequest } from '../../lib/server/auth.js'
import { fulfillSubscription } from '../../lib/server/fulfillSubscription.js'
import { getUsageState } from '../../lib/server/usage.js'
import { prisma } from '../../lib/server/prisma.js'

/**
 * Pull the latest Stripe subscription for the signed-in user.
 * Recovers accounts when Checkout succeeded but the webhook never updated the DB.
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

    const stripe = new Stripe(secret)
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 })
      const withSub = []
      for (const c of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: c.id,
          status: 'all',
          limit: 5,
        })
        const active = subs.data.find((s) => s.status === 'active' || s.status === 'trialing')
        if (active) {
          withSub.push({ customerId: c.id, subscriptionId: active.id })
          break
        }
      }
      if (!withSub.length) {
        return res.status(404).json({
          error: 'No active Stripe subscription found for this account.',
          code: 'NO_SUBSCRIPTION',
        })
      }
      customerId = withSub[0].customerId
      const wasFree = user.subscriptionTier === 'free'
      await fulfillSubscription(prisma, stripe, {
        userId: user.id,
        customerId,
        subscriptionId: withSub[0].subscriptionId,
        resetUsage: wasFree,
      })
    } else {
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
      const wasFree = user.subscriptionTier === 'free'
      await fulfillSubscription(prisma, stripe, {
        userId: user.id,
        customerId,
        subscriptionId: active.id,
        resetUsage: wasFree,
      })
    }

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    const usage = await getUsageState(prisma, user.id, updated)

    return res.status(200).json({
      ok: true,
      tier: updated.subscriptionTier,
      status: updated.subscriptionStatus,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        subscriptionTier: updated.subscriptionTier,
        subscriptionStatus: updated.subscriptionStatus,
        billingPortalAvailable: !!updated.stripeCustomerId,
      },
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
