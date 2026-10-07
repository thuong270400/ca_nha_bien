import type { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import type { prisma } from '../utils/prisma'

/** Đơn vị bán duy nhất của mọi combo (biến thể duy nhất, xem Product.isCombo). */
export const COMBO_UNIT = 'combo'

/**
 * Tính lại giá/tồn kho/số ngày có hàng của các combo — gọi trong cùng transaction
 * với mọi thay đổi có thể ảnh hưởng tới thành phần (tạo/sửa combo, sửa/ẩn sản
 * phẩm thường, tạo đơn trừ kho). Chọn combo theo `comboIds` hoặc theo combo nào
 * có thành phần thuộc `variantIds`.
 *
 * - compareAtPrice = tổng (giá biến thể thành phần x số lượng) — "giá gốc" combo
 * - price = compareAtPrice - comboDiscount (không âm)
 * - stock = số combo tối đa ghép được từ tồn kho thành phần; 0 nếu có thành phần
 *   đang bị ẩn/ngừng bán — nhờ đó giỏ hàng/checkout kiểm tra tồn kho combo y như
 *   sản phẩm thường mà không cần biết đó là combo.
 * - availabilityDays = lớn nhất trong các thành phần (combo giao khi đủ hàng).
 */
export async function refreshCombos(tx: Prisma.TransactionClient, filter: { comboIds?: string[], variantIds?: string[] }) {
  const or: Prisma.ProductWhereInput[] = []
  if (filter.comboIds?.length) or.push({ id: { in: filter.comboIds } })
  if (filter.variantIds?.length) or.push({ comboItems: { some: { variantId: { in: filter.variantIds } } } })
  if (!or.length) return

  const combos = await tx.product.findMany({
    where: { isCombo: true, OR: or },
    include: {
      comboItems: { include: { variant: { include: { product: { select: { status: true, deletedAt: true, availabilityDays: true } } } } } },
    },
  })

  for (const combo of combos) {
    let total = 0
    let stock = combo.comboItems.length ? Number.POSITIVE_INFINITY : 0
    let availabilityDays: number | null = null
    for (const item of combo.comboItems) {
      const component = item.variant.product
      total += Number(item.variant.price) * item.quantity
      const sellable = component.status === 'ACTIVE' && !component.deletedAt
      stock = Math.min(stock, sellable ? Math.floor(item.variant.stock / item.quantity) : 0)
      if (component.availabilityDays !== null && (availabilityDays === null || component.availabilityDays > availabilityDays)) {
        availabilityDays = component.availabilityDays
      }
    }
    const discount = Math.min(Number(combo.comboDiscount ?? 0), total)
    const price = (total - discount).toFixed(2)
    const compareAtPrice = discount > 0 ? total.toFixed(2) : null

    await tx.productVariant.updateMany({
      where: { productId: combo.id },
      data: { unit: COMBO_UNIT, price, compareAtPrice, stock, isDefault: true },
    })
    await tx.product.update({
      where: { id: combo.id },
      data: { price, compareAtPrice, stock, availabilityDays },
    })
  }
}

/** Chặn xoá biến thể đang là thành phần của combo — FK Restrict sẽ báo lỗi khó hiểu. */
export async function assertVariantsNotInCombo(client: typeof prisma | Prisma.TransactionClient, variantIds: string[]) {
  if (!variantIds.length) return
  const used = await client.comboItem.findFirst({
    where: { variantId: { in: variantIds } },
    include: { combo: { select: { name: true } }, variant: { select: { unit: true } } },
  })
  if (used) {
    throw Errors.conflict(`Đơn vị "${used.variant.unit}" đang nằm trong combo "${used.combo.name}" — hãy gỡ khỏi combo trước`)
  }
}
