import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma.js'

const SALT_ROUNDS = 10

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

/**
 * @param {{ id: string, email: string }} user
 */
export function signToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' })
}

/**
 * @param {string} token
 * @returns {{ sub: string, email: string } | null}
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret || !token) return null
  try {
    const decoded = jwt.verify(token, secret)
    if (typeof decoded === 'object' && decoded && 'sub' in decoded && typeof decoded.sub === 'string') {
      return { sub: decoded.sub, email: typeof decoded.email === 'string' ? decoded.email : '' }
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
  return user
}
