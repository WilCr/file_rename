import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'

const SALT_ROUNDS = 12

/**
 * @param {string} password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * @param {string} password
 * @param {string} hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

function getJwtSecret() {
  const secret = typeof process.env.JWT_SECRET === 'string' ? process.env.JWT_SECRET.trim() : ''
  return secret || null
}

/**
 * @param {{ id: string, email: string, tokenVersion?: number }} user
 */
export function signToken(user) {
  const secret = getJwtSecret()
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    { sub: user.id, email: user.email, ver: user.tokenVersion ?? 0 },
    secret,
    { expiresIn: '7d' },
  )
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, ver: number } | null}
 */
export function verifyToken(token) {
  const secret = getJwtSecret()
  if (!secret || !token) return null
  try {
    const decoded = jwt.verify(token, secret)
    if (typeof decoded === 'object' && decoded && 'sub' in decoded && typeof decoded.sub === 'string') {
      return {
        sub: decoded.sub,
        email: typeof decoded.email === 'string' ? decoded.email : '',
        ver: typeof decoded.ver === 'number' ? decoded.ver : 0,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * @param {import('http').IncomingMessage} req
 */
export function getBearerToken(req) {
  const raw = req.headers?.authorization
  if (!raw || typeof raw !== 'string') return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

/**
 * @param {import('http').IncomingMessage} req
 */
export async function getUserFromRequest(req) {
  const token = getBearerToken(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) return null
  if ((user.tokenVersion ?? 0) !== payload.ver) return null
  return user
}

/**
 * @param {{ id: string, email: string, name?: string | null, subscriptionTier?: string | null, subscriptionStatus?: string | null, stripeCustomerId?: string | null }} user
 */
export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    billingPortalAvailable: !!user.stripeCustomerId,
  }
}
