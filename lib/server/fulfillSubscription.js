import { tierFromPriceId } from './stripeTier.js'

/**
 * Apply a Stripe subscription to the matching app user.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {import('stripe').default} stripe
 * @param {{
 *   userId: string,
 *   customerId: string,
 *   subscriptionId: string,
 *   resetUsage?: boolean,
 * }} opts
 */
export async function fulfillSubscription(prisma, stripe, opts) {
  const { userId, customerId, subscriptionId, resetUsage = false } = opts

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = sub.items.data[0]?.price?.id
  const tier = tierFromPriceId(priceId)
  const active = sub.status === 'active' || sub.status === 'trialing'

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: sub.status,
      subscriptionTier: active ? tier : 'free',
    },
  })

  // When someone upgrades after hitting the free cap, give them a clean Pro month.
  if (resetUsage && active && tier !== 'free') {
    const month = new Date().toISOString().slice(0, 7)
    await prisma.usage.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, count: 0 },
      update: { count: 0 },
    })
  }

  return { tier: active ? tier : 'free', status: sub.status }
}
