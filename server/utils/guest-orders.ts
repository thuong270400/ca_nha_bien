import type { H3Event } from 'h3'

const COOKIE = 'guest_order_ids'
const MAX_IDS = 20
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/** Lets a guest (no account) view the order(s) they just placed in this browser, without exposing other guests' orders by guessing an id. */
export function getGuestOrderIds(event: H3Event): string[] {
  const raw = getCookie(event, COOKIE)
  if (!raw) return []
  try {
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function addGuestOrderId(event: H3Event, orderId: string) {
  const next = [orderId, ...getGuestOrderIds(event).filter(id => id !== orderId)].slice(0, MAX_IDS)
  setCookie(event, COOKIE, JSON.stringify(next), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  })
}
