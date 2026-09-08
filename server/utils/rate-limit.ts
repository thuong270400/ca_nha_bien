import { Errors } from './errors'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// In-memory only — fine for a single Node process; a multi-instance deployment
// would need a shared store (e.g. Redis) instead.
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}, 5 * 60_000).unref()

/** Throws 429 once `max` calls happen for `key` within `windowMs`. */
export function checkRateLimit(key: string, opts: { max: number, windowMs: number }) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }

  bucket.count += 1
  if (bucket.count > opts.max) {
    throw Errors.tooManyRequests('Bạn thao tác quá nhanh, vui lòng thử lại sau vài phút')
  }
}
