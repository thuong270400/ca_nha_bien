export function generateOrderNumber(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${y}${m}${d}-${random}`
}

// Matches the shape produced above (ORD + 8 digits + 4 digits) with up to 3
// non-digit characters allowed between segments, so it still finds the order
// number inside a bank transfer's mangled content/description (banks may
// strip dashes, add spaces, or change case) — used to match a SePay webhook
// transaction back to the order it paid for.
const ORDER_NUMBER_PATTERN = /ORD\D{0,3}(\d{8})\D{0,3}(\d{4})/i

export function extractOrderNumber(text: string | null | undefined): string | null {
  if (!text) return null
  const match = ORDER_NUMBER_PATTERN.exec(text)
  return match ? `ORD-${match[1]}-${match[2]}` : null
}
