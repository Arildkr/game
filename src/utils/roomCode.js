/**
 * Room code utilities
 */

/**
 * Generate a random 6-character room code
 * Uses only unambiguous characters (no I, O, 0, 1)
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false
  return /^[A-Z2-9]{6}$/.test(code.toUpperCase())
}

/**
 * Normalize room code (uppercase, trimmed)
 */
export function normalizeRoomCode(code) {
  if (!code) return ''
  return code.toUpperCase().trim()
}
