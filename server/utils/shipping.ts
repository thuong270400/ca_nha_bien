const FREE_SHIPPING_THRESHOLD = 500_000
const FLAT_SHIPPING_FEE = 30_000

/** Flat-rate shipping: free above the threshold, otherwise a fixed fee. */
export function calculateShippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE
}
