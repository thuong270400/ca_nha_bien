/**
 * Sản phẩm chưa chọn phân loại nguồn cá nào (SourcingClassification) thì mặc
 * định coi là "hàng có sẵn": giao trong 1-2 ngày. Dùng chung cho hiển thị
 * storefront (ProductCard, trang chi tiết sản phẩm) và tính
 * Order.estimatedAvailabilityDays/nhóm đợt giao khi tạo đơn. Mức cọc (nếu có)
 * không theo từng phân loại — xem Setting.depositPercent, áp dụng chung cho mọi
 * sản phẩm.
 */
export const DEFAULT_SOURCING_LABEL = 'Có sẵn'
export const DEFAULT_AVAILABILITY_FROM_DAYS = 1
export const DEFAULT_AVAILABILITY_TO_DAYS = 2

interface SourcingClassificationLike {
  name: string
  availabilityFromDays: number | null
  availabilityToDays: number | null
}

/** "1-2 ngày" nếu from khác to, "2 ngày" nếu bằng nhau hoặc chỉ có 1 vế, null nếu không có dữ liệu. */
export function formatDayRange(fromDays: number | null | undefined, toDays: number | null | undefined): string | null {
  if (fromDays == null && toDays == null) return null
  if (fromDays == null) return `${toDays} ngày`
  if (toDays == null || toDays === fromDays) return `${fromDays} ngày`
  return `${fromDays}-${toDays} ngày`
}

/** Phân loại nguồn cá của sản phẩm (đã chọn, hay mặc định "Có sẵn" nếu sản phẩm
 * chưa chọn phân loại nào) — dùng để hiển thị (card, trang chi tiết). */
export function resolveSourcingClassification<T extends SourcingClassificationLike>(classification: T | null | undefined): SourcingClassificationLike {
  if (!classification) {
    return {
      name: DEFAULT_SOURCING_LABEL,
      availabilityFromDays: DEFAULT_AVAILABILITY_FROM_DAYS,
      availabilityToDays: DEFAULT_AVAILABILITY_TO_DAYS,
    }
  }
  return classification
}

/** Khoảng ngày dự kiến có cá của 1 sản phẩm trong giỏ/đơn — dùng làm khoá nhóm
 * đợt giao khi khách chọn "giao nhiều lần" ở checkout (2 sản phẩm cùng khoảng
 * (from,to) thì cùng 1 đợt) và để tính Order.estimatedAvailabilityDays khi
 * "giao 1 lần" (lấy "to" lớn nhất trong giỏ ở nơi gọi hàm này). */
export function resolveAvailabilityWindow<T extends SourcingClassificationLike>(classification: T | null | undefined): { fromDays: number, toDays: number } {
  const resolved = resolveSourcingClassification(classification)
  const toDays = resolved.availabilityToDays ?? resolved.availabilityFromDays ?? DEFAULT_AVAILABILITY_TO_DAYS
  const fromDays = resolved.availabilityFromDays ?? toDays
  return { fromDays, toDays }
}

interface AvailabilityWindowLike {
  availabilityFromDays: number | null
  availabilityToDays: number | null
}

export interface AvailabilityGroup<T> {
  fromDays: number
  toDays: number
  items: T[]
}

/** Gộp các item (CartItem/OrderItem) có cùng khoảng ngày dự kiến có cá vào 1 đợt
 * giao — dùng khi khách chọn "giao nhiều lần". Item thiếu dữ liệu (đơn cũ trước
 * khi có tính năng này) dùng mức mặc định "hàng có sẵn". Sắp xếp theo "to" tăng
 * dần (đợt có hàng sớm nhất trước). */
export function groupByAvailabilityWindow<T extends AvailabilityWindowLike>(items: T[]): AvailabilityGroup<T>[] {
  const groups = new Map<string, AvailabilityGroup<T>>()
  for (const item of items) {
    const fromDays = item.availabilityFromDays ?? DEFAULT_AVAILABILITY_FROM_DAYS
    const toDays = item.availabilityToDays ?? DEFAULT_AVAILABILITY_TO_DAYS
    const key = `${fromDays}-${toDays}`
    const group = groups.get(key)
    if (group) {
      group.items.push(item)
    } else {
      groups.set(key, { fromDays, toDays, items: [item] })
    }
  }
  return [...groups.values()].sort((a, b) => a.toDays - b.toDays || a.fromDays - b.fromDays)
}
