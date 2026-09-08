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
  const coupon = await prisma.coupon.findUnique({ where: { id } })
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

export async function validateCoupon(client: CouponClient, codeRaw: string, subtotal: number) {
  const code = codeRaw.trim().toUpperCase()
  const coupon = await client.coupon.findUnique({ where: { code } })
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
