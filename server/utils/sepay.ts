import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

// SePay's own guidance for the HMAC method: reject a timestamp more than 5
// minutes off to block replay of a captured request.
const HMAC_REPLAY_WINDOW_SECONDS = 300

/**
 * Verifies a SePay webhook call before its body is used, using whichever
 * security method is configured on SePay's webhook (Company -> Webhooks ->
 * Security): HMAC-SHA256 checked first when SEPAY_WEBHOOK_HMAC_SECRET is
 * set, else API Key (SEPAY_WEBHOOK_API_KEY). Both are values you generate
 * yourself and paste into SePay's dashboard when creating the webhook, not
 * something SePay issues separately. Fails closed: if neither env var is
 * set, every request is rejected rather than accepted unauthenticated.
 */
export async function verifySepayWebhook(event: H3Event) {
  const hmacSecret = process.env.SEPAY_WEBHOOK_HMAC_SECRET
  if (hmacSecret) return verifyHmac(event, hmacSecret)
  return verifyApiKey(event, process.env.SEPAY_WEBHOOK_API_KEY)
}

/**
 * SePay signs `${timestamp}.${rawBody}` and sends the hex digest as
 * `X-SePay-Signature: sha256=<hex>` alongside `X-SePay-Timestamp` (unix
 * seconds) — https://developer.sepay.vn/en/sepay-webhooks/xac-thuc. Must
 * sign the exact bytes SePay sent, so this reads the raw body itself instead
 * of relying on the route's later (parsed) readValidatedBody — h3 caches the
 * raw body, so that later read still works off these same bytes.
 */
async function verifyHmac(event: H3Event, secret: string) {
  const signature = getHeader(event, 'x-sepay-signature')
  const timestamp = getHeader(event, 'x-sepay-timestamp')
  if (!signature || !timestamp) throw Errors.unauthorized('Webhook không hợp lệ')

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > HMAC_REPLAY_WINDOW_SECONDS) {
    throw Errors.unauthorized('Webhook không hợp lệ')
  }

  const rawBody = (await readRawBody(event, 'utf8')) ?? ''
  const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
  if (!timingSafeEqualStrings(expected, signature)) throw Errors.unauthorized('Webhook không hợp lệ')
}

/** `Authorization: Apikey <value>` — see verifySepayWebhook. */
function verifyApiKey(event: H3Event, expected: string | undefined) {
  const header = getHeader(event, 'authorization')
  const provided = header?.startsWith('Apikey ') ? header.slice('Apikey '.length).trim() : null

  if (!expected || !provided || !timingSafeEqualStrings(expected, provided)) {
    throw Errors.unauthorized('Webhook không hợp lệ')
  }
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
