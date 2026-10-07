import type { OrderComboItemSnapshot } from '#shared/types/order'

/** "2 × Cá thu (kg), 1 × Mực ống (con)" — thành phần combo đã snapshot trên OrderItem. */
export function formatComboContents(items: OrderComboItemSnapshot[] | null | undefined): string {
  return (items ?? []).map(i => `${i.quantity} × ${i.productName} (${i.unit})`).join(', ')
}
