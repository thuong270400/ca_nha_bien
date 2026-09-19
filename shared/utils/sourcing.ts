/**
 * Sản phẩm chưa gắn phân loại nguồn cá nào (ProductSourcingOption) thì mặc định
 * coi là "hàng có sẵn": thanh toán đủ 100% (không cọc), giao trong 1-2 ngày.
 * Dùng chung cho hiển thị storefront (ProductCard, trang chi tiết sản phẩm) và
 * tính Order.depositPercent/estimatedAvailabilityDays khi tạo đơn.
 */
export const DEFAULT_SOURCING_LABEL = 'Có sẵn'
export const DEFAULT_AVAILABILITY_TEXT = '1-2 ngày'
export const DEFAULT_AVAILABILITY_DAYS = 2
export const DEFAULT_DEPOSIT_PERCENT = 0

interface SourcingOptionLike {
  label: string
  expectedAvailability: string | null
  expectedAvailabilityDays: number | null
  depositPercent: number | null
}

/** Phân loại "đại diện" cho hiển thị (card, trang chi tiết) — lấy phân loại có
 * thời gian dự kiến dài nhất nếu sản phẩm có khai báo, hoặc mặc định "Có sẵn"
 * nếu chưa khai báo phân loại nào. */
export function resolvePrimarySourcingOption<T extends SourcingOptionLike>(options: T[]): SourcingOptionLike {
  if (!options.length) {
    return {
      label: DEFAULT_SOURCING_LABEL,
      expectedAvailability: DEFAULT_AVAILABILITY_TEXT,
      expectedAvailabilityDays: DEFAULT_AVAILABILITY_DAYS,
      depositPercent: DEFAULT_DEPOSIT_PERCENT,
    }
  }
  return [...options].sort((a, b) => (b.expectedAvailabilityDays ?? -1) - (a.expectedAvailabilityDays ?? -1))[0]!
}

/** Mức đóng góp của 1 sản phẩm vào cọc/thời gian giao dự kiến chung của cả đơn
 * (order.service.ts lấy max qua mọi sản phẩm trong giỏ) — sản phẩm chưa khai
 * báo phân loại nào đóng góp mức mặc định (0% cọc, 2 ngày), sản phẩm đã khai
 * báo thì lấy max trong chính các phân loại của nó (không cộng thêm mặc định). */
export function sourcingContribution<T extends SourcingOptionLike>(options: T[]): { depositPercent: number, availabilityDays: number } {
  if (!options.length) {
    return { depositPercent: DEFAULT_DEPOSIT_PERCENT, availabilityDays: DEFAULT_AVAILABILITY_DAYS }
  }
  let depositPercent = 0
  let availabilityDays = 0
  for (const opt of options) {
    if (opt.depositPercent && opt.depositPercent > depositPercent) depositPercent = opt.depositPercent
    if (opt.expectedAvailabilityDays && opt.expectedAvailabilityDays > availabilityDays) availabilityDays = opt.expectedAvailabilityDays
  }
  return { depositPercent, availabilityDays }
}
