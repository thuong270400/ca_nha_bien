import type { Prisma, PrismaClient } from '../generated/prisma/client'
import { Errors } from '../utils/errors'
import { prisma } from '../utils/prisma'
import type { CouponCreateInput, CouponListQuery, CouponUpdateInput } from '../utils/schemas/coupon.schema'

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing && existing.id !== excludeId) {
    throw Errors.conflict('Mã giảm giá đã tồn tại')
  }
}

export async function listCoupons(query: CouponListQuery) {
  const where: Prisma.CouponWhereInput = {
    isActive: query.isActive,
    ...(query.q ? { code: { contains: query.q, mode: 'insensitive' } } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.coupon.count({ where }),
  ])

  return {
    data,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export async function getCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { category: true } })
  if (!coupon) throw Errors.notFound('Không tìm thấy mã giảm giá')
  return coupon
}

export async function createCoupon(input: CouponCreateInput) {
  await assertCodeAvailable(input.code)
  return prisma.coupon.create({ data: input })
}

export async function updateCoupon(id: string, input: CouponUpdateInput) {
  await getCouponById(id)
  if (input.code) await assertCodeAvailable(input.code, id)
  return prisma.coupon.update({ where: { id }, data: input })
}

export async function deleteCoupon(id: string) {
  const coupon = await getCouponById(id)
  if (coupon.usedCount > 0) {
    throw Errors.badRequest('Không thể xoá mã đã được sử dụng — hãy Vô hiệu hoá thay vì xoá')
  }
  await prisma.coupon.delete({ where: { id } })
}

interface CouponForDiscount {
  type: 'PERCENTAGE' | 'FIXED'
  value: Prisma.Decimal | number
  maxDiscount: Prisma.Decimal | number | null
}

export function computeDiscount(coupon: CouponForDiscount, subtotal: number): number {
  if (coupon.type === 'PERCENTAGE') {
    const raw = subtotal * (Number(coupon.value) / 100)
    const capped = coupon.maxDiscount ? Math.min(raw, Number(coupon.maxDiscount)) : raw
    return Math.min(capped, subtotal)
  }
  return Math.min(Number(coupon.value), subtotal)
}

type CouponClient = PrismaClient | Prisma.TransactionClient

/** Coupons currently within their active window and usage limit — active, in date range, not exhausted. */
async function fetchRedeemableCoupons() {
  const now = new Date()
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return coupons.filter(c => c.usageLimit === null || c.usedCount < c.usageLimit)
}

/** Promo listing for the landing page's coupon ticket row — not tied to any cart, so no eligibility/discount computed. */
export async function listPromotedCoupons() {
  const coupons = await fetchRedeemableCoupons()
  return coupons.map(coupon => ({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderValue: coupon.minOrderValue,
    maxDiscount: coupon.maxDiscount,
    usageLimit: coupon.usageLimit,
    categoryId: coupon.categoryId,
    categoryName: coupon.category.name,
  }))
}

/** Currently redeemable coupons (active, within date window, under usage limit) for the storefront's "view coupons" picker. */
export async function listAvailableCoupons(subtotal: number) {
  const coupons = await fetchRedeemableCoupons()

  return coupons
    .map((coupon) => {
      const minOrderValue = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0
      const eligible = subtotal >= minOrderValue
      const discountAmount = eligible ? computeDiscount(coupon, subtotal) : 0
      return {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        expiresAt: coupon.expiresAt,
        categoryId: coupon.categoryId,
        categoryName: coupon.category.name,
        eligible,
        discountAmount: discountAmount.toFixed(2),
        missingAmount: Math.max(minOrderValue - subtotal, 0).toFixed(2),
      }
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible))
}

export async function validateCoupon(client: CouponClient, codeRaw: string, subtotal: number) {
  const code = codeRaw.trim().toUpperCase()
  const coupon = await client.coupon.findUnique({ where: { code }, include: { category: true } })
  if (!coupon || !coupon.isActive) throw Errors.badRequest('Mã giảm giá không hợp lệ')

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) throw Errors.badRequest('Mã giảm giá chưa có hiệu lực')
  if (coupon.expiresAt && coupon.expiresAt < now) throw Errors.badRequest('Mã giảm giá đã hết hạn')
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw Errors.badRequest('Mã giảm giá đã hết lượt sử dụng')
  }
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    throw Errors.badRequest('Chưa đạt giá trị đơn hàng tối thiểu để áp dụng mã này')
  }

  return { coupon, discountAmount: computeDiscount(coupon, subtotal) }
}
