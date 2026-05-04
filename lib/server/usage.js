/** @typedef {'free' | 'pro' | 'business'} Tier */

/**
 * @param {string} tier
 * @returns {number}
 */
export function getMonthlyLimit(tier) {
  switch (tier) {
    case 'pro':
      return 500
    case 'business':
      return 999_999
    default:
      return 10
  }
}

/**
 * @param {string} userId
 * @param {string} month YYYY-MM
 */
export async function getUsageForMonth(prisma, userId, month) {
  const row = await prisma.usage.findUnique({
    where: { userId_month: { userId, month } },
  })
  return row?.count ?? 0
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {{ subscriptionTier: string }} user
 */
export async function getUsageState(prisma, userId, user) {
  const month = new Date().toISOString().slice(0, 7)
  const limit = getMonthlyLimit(user.subscriptionTier)
  const used = await getUsageForMonth(prisma, userId, month)
  const exceeded = used >= limit
  return {
    month,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    exceeded,
  }
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} userId
 * @param {string} month
 */
export async function incrementUsage(prisma, userId, month) {
  await prisma.usage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, count: 1 },
    update: { count: { increment: 1 } },
  })
}
