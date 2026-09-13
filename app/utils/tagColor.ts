export const TAG_COLOR_PRESETS = [
  '#6B7280', // xám (mặc định)
  '#EF4444', // đỏ
  '#F97316', // cam
  '#F59E0B', // vàng hổ phách
  '#84CC16', // xanh lá chanh
  '#10B981', // xanh lá
  '#14B8A6', // xanh ngọc
  '#0EA5E9', // xanh dương
  '#6366F1', // chàm
  '#A855F7', // tím
  '#EC4899', // hồng
]

export function tagTextColor(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1F2937' : '#FFFFFF'
}
