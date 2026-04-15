// Simple in-memory rate limiter for Edge / Node runtime
// Note: this resets on cold starts and isn't shared across Vercel regions.
// For production-grade rate limiting, use Upstash Redis / Vercel KV.

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Cleanup old entries every 5 minutes
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 300000) return
  lastCleanup = now
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}

/**
 * Returns true if the request should be ALLOWED, false if RATE LIMITED.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    const newEntry: Entry = { count: 1, resetAt: now + options.windowMs }
    store.set(key, newEntry)
    return { allowed: true, remaining: options.limit - 1, resetAt: newEntry.resetAt }
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Get client identifier from request (IP + user agent fingerprint).
 */
export function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
  return `rl:${ip}`
}
