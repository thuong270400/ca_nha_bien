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
