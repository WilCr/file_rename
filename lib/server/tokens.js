import crypto from 'node:crypto'

/**
 * Store only a hash of password-reset tokens so a DB leak is not enough to take over accounts.
 * @param {string} token
 */
export function hashSecretToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex')
}

export function newResetToken() {
  return crypto.randomBytes(32).toString('hex')
}
