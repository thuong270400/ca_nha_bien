import type { Prisma } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { ComboCreateInput, ComboUpdateInput } from '../utils/schemas/combo.schema'
import { COMBO_UNIT, refreshCombos } from './combo-sync.service'
import { activeProductWhere, assertSlugAvailable, getProductById, productInclude, syncImages } from './product.service'
import { deleteImage } from './upload.service'

/** Admin-only: bật lại `importPrice` bị ẩn bởi global omit (server/utils/prisma.ts). */
const adminProductOmit = { importPrice: false } as const

/** Combo đang bán cho mục "Combo / Ưu đãi" ở trang chủ. */
export async function getHomepageCombos(limit = 12) {
  return prisma.product.findMany({
    where: { ...activeProductWhere, isCombo: true },
    include: productInclude,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })
}

/**
 * Kiểm tra thành phần combo: mỗi biến thể phải tồn tại, thuộc sản phẩm thường
 * (không lồng combo trong combo) chưa bị xoá, không trùng nhau — và số tiền
 * giảm phải nhỏ hơn tổng giá gốc để giá bán còn dương.
 */
async function validateComboItems(items: ComboCreateInput['items'], discount: number) {
  const variantIds = items.map(i => i.variantId)
  if (new Set(variantIds).size !== variantIds.length) {
    throw Errors.badRequest('Một đơn vị sản phẩm chỉ được thêm 1 lần vào combo — hãy tăng số lượng thay vì thêm lại')
  }
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true, isCombo: true, deletedAt: true } } },
  })
  if (variants.length !== variantIds.length) throw Errors.badRequest('Có sản phẩm trong combo không còn tồn tại')
  for (const v of variants) {
    if (v.product.isCombo) throw Errors.badRequest('Không thể thêm combo vào trong combo khác')
    if (v.product.deletedAt) throw Errors.badRequest(`Sản phẩm "${v.product.name}" đã bị xoá`)
  }
  const total = items.reduce((sum, item) => sum + Number(variants.find(v => v.id === item.variantId)!.price) * item.quantity, 0)
  if (discount >= total) throw Errors.badRequest('Số tiền giảm phải nhỏ hơn tổng giá gốc của combo')
}

export async function createCombo(input: ComboCreateInput) {
  await assertSlugAvailable(input.slug)
  await validateComboItems(input.items, input.discount)

  return prisma.$transaction(async (tx) => {
    const combo = await tx.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        status: input.status ?? 'ACTIVE',
        isFeatured: input.isFeatured ?? false,
        isCombo: true,
        comboDiscount: input.discount,
        images: input.images?.length
          ? { create: input.images.map((img, idx) => ({ url: img.url, alt: img.alt, position: img.position ?? idx })) }
          : undefined,
        // Giá/tồn kho thật do refreshCombos tính ngay bên dưới.
        variants: { create: { unit: COMBO_UNIT, price: 0, stock: 0, isDefault: true } },
        comboItems: { create: input.items.map((item, idx) => ({ variantId: item.variantId, quantity: item.quantity, position: idx })) },
      },
    })
    await refreshCombos(tx, { comboIds: [combo.id] })
    return tx.product.findUniqueOrThrow({ where: { id: combo.id }, include: productInclude, omit: adminProductOmit })
  })
}

export async function updateCombo(id: string, input: ComboUpdateInput) {
  const existing = await getProductById(id, { includeInactive: true })
  if (!existing.isCombo) throw Errors.notFound('Không tìm thấy combo')
  if (input.slug) await assertSlugAvailable(input.slug, id)

  const items = input.items ?? existing.comboItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
  const discount = input.discount ?? Number(existing.comboDiscount ?? 0)
  if (input.items || input.discount !== undefined) await validateComboItems(items, discount)

  const { combo, removedImageUrls } = await prisma.$transaction(async (tx) => {
    const removedImageUrls = input.images ? await syncImages(tx, id, input.images) : []
    if (input.items) {
      await tx.comboItem.deleteMany({ where: { comboId: id } })
      await tx.comboItem.createMany({
        data: input.items.map((item, idx) => ({ comboId: id, variantId: item.variantId, quantity: item.quantity, position: idx })),
      })
    }
    const data: Prisma.ProductUpdateInput = {
      name: input.name,
      slug: input.slug,
      description: input.description,
      status: input.status,
      deletedAt: input.status === 'ACTIVE' ? null : undefined,
      isFeatured: input.isFeatured,
      comboDiscount: input.discount,
    }
    await tx.product.update({ where: { id }, data })
    await refreshCombos(tx, { comboIds: [id] })
    const combo = await tx.product.findUniqueOrThrow({ where: { id }, include: productInclude, omit: adminProductOmit })
    return { combo, removedImageUrls }
  })

  await Promise.all(removedImageUrls.map(url => deleteImage(url)))
  return combo
}
