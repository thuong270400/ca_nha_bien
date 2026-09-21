/**
 * Sản phẩm chưa nhập số ngày dự kiến có hàng (Product.availabilityDays) thì mặc
 * định coi là "hàng có sẵn": giao trong 2 ngày. Dùng chung cho hiển thị
 * storefront (ProductCard, trang chi tiết sản phẩm) và tính
 * Order.estimatedAvailabilityDays/nhóm đợt giao khi tạo đơn. Mức cọc (nếu có)
 * không theo từng sản phẩm — xem Setting.depositPercent, áp dụng chung cho mọi
 * sản phẩm.
 */
export const DEFAULT_AVAILABILITY_DAYS = 2

/** "X ngày" nếu có dữ liệu, null nếu không. */
export function formatDays(days: number | null | undefined): string | null {
  if (days == null) return null
  return `${days} ngày`
}

/** Số ngày dự kiến có hàng của 1 sản phẩm (hay mặc định "hàng có sẵn" nếu sản
 * phẩm chưa nhập) — dùng làm khoá nhóm đợt giao khi khách chọn "giao nhiều
 * lần" ở checkout (2 sản phẩm cùng số ngày này thì cùng 1 đợt) và để tính
 * Order.estimatedAvailabilityDays khi "giao 1 lần" (lấy số lớn nhất trong giỏ
 * ở nơi gọi hàm này). */
export function resolveAvailabilityDays(days: number | null | undefined): number {
  return days ?? DEFAULT_AVAILABILITY_DAYS
}

interface AvailabilityDaysLike {
  availabilityDays: number | null
}

export interface AvailabilityGroup<T> {
  days: number
  items: T[]
}

/** Gộp các item (CartItem/OrderItem) có cùng số ngày dự kiến có hàng vào 1 đợt
 * giao — dùng khi khách chọn "giao nhiều lần". Item thiếu dữ liệu (đơn cũ trước
 * khi có tính năng này) dùng mức mặc định "hàng có sẵn". Sắp xếp theo số ngày
 * tăng dần (đợt có hàng sớm nhất trước). */
export function groupByAvailabilityDays<T extends AvailabilityDaysLike>(items: T[]): AvailabilityGroup<T>[] {
  const groups = new Map<number, AvailabilityGroup<T>>()
  for (const item of items) {
    const days = item.availabilityDays ?? DEFAULT_AVAILABILITY_DAYS
    const group = groups.get(days)
    if (group) {
      group.items.push(item)
    } else {
      groups.set(days, { days, items: [item] })
    }
  }
  return [...groups.values()].sort((a, b) => a.days - b.days)
}
