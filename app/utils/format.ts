const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function formatVnd(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return vndFormatter.format(Number(value))
}

export function unitLabel(unit: string): string {
  return `/ ${unit}`
}

// Số tiền được giảm dạng "-20.000đ" (badge giảm giá trên thẻ/chi tiết sản phẩm).
export function formatDiscountVnd(amount: number): string {
  return `-${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount)}đ`
}
