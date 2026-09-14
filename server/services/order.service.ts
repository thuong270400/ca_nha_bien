import type { CreateOrderInput } from '#shared/schemas/order.schema'
import { validateCoupon } from './coupon.service'
import { Prisma } from '../generated/prisma/client'
import type { OrderStatus } from '../generated/prisma/enums'
import { Errors } from '../utils/errors'
import { generateOrderNumber } from '../utils/order-number'
import { prisma } from '../utils/prisma'
import { calculateShippingFee } from '../utils/shipping'

const orderInclude = {
  items: true,
  coupons: true,
  payment: true,
  shipping: true,
} satisfies Prisma.OrderInclude

interface OrderContext {
  userId: string | null
  isAdmin: boolean
}

export async function createOrder(input: CreateOrderInput, ctx: { userId: string | null, cartId: string }) {
  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptCreateOrder(input, ctx)
    } catch (err) {
      const isOrderNumberCollision = err instanceof Prisma.PrismaClientKnownRequestError
        && err.code === 'P2002'
        && attempt < MAX_ATTEMPTS
      if (!isOrderNumberCollision) throw err
    }
  }
  throw Errors.badRequest('Không thể tạo đơn hàng, vui lòng thử lại')
}

async function attemptCreateOrder(input: CreateOrderInput, ctx: { userId: string | null, cartId: string }) {
  if (input.addressId) {
    const address = await prisma.address.findUnique({ where: { id: input.addressId } })
    if (!address || address.userId !== ctx.userId) {
      throw Errors.badRequest('Địa chỉ giao hàng không hợp lệ')
    }
  }

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { id: ctx.cartId },
      include: { items: { include: { variant: true, product: true } } },
    })
    if (!cart || cart.items.length === 0) throw Errors.badRequest('Giỏ hàng đang trống')

    let subtotal = 0
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = []

    for (const item of cart.items) {
      if (item.product.deletedAt || item.product.status !== 'ACTIVE') {
        throw Errors.badRequest(`Sản phẩm "${item.product.name}" hiện không kinh doanh, vui lòng xoá khỏi giỏ hàng`)
      }
      const lineTotal = Number(item.variant.price) * item.quantity
      subtotal += lineTotal
      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        unit: item.variant.unit,
        price: item.variant.price,
        quantity: item.quantity,
        lineTotal: lineTotal.toFixed(2),
      })
    }

    for (const item of cart.items) {
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (result.count === 0) {
        throw Errors.badRequest(`Sản phẩm "${item.product.name}" không đủ tồn kho`)
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity }, stock: { decrement: item.quantity } },
      })
    }

    // At most 1 coupon per CouponCategory — a customer can stack coupons from
    // different categories (e.g. one "free shipping" + one "product discount")
    // but not two from the same one.
    const appliedCoupons: { couponId: string, couponCode: string, discountAmount: number }[] = []
    const seenCategoryIds = new Set<string>()
    for (const code of input.couponCodes ?? []) {
      const { coupon, discountAmount: amount } = await validateCoupon(tx, code, subtotal)
      if (seenCategoryIds.has(coupon.categoryId)) {
        throw Errors.badRequest(`Chỉ được áp dụng 1 mã giảm giá cho mỗi danh mục (mã "${coupon.code}" trùng danh mục với một mã khác đã chọn)`)
      }
      seenCategoryIds.add(coupon.categoryId)
      // Atomic guard, mirrors the stock `stock: {gte: quantity}` guard above — usageLimit was
      // read moments earlier in this same transaction, so this re-checks it against the latest
      // committed row rather than trusting the stale value already in memory.
      const claim = await tx.coupon.updateMany({
        where: {
          id: coupon.id,
          isActive: true,
          ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      })
      if (claim.count === 0) throw Errors.badRequest(`Mã giảm giá "${coupon.code}" không còn hiệu lực hoặc đã hết lượt sử dụng`)
      appliedCoupons.push({ couponId: coupon.id, couponCode: coupon.code, discountAmount: amount })
    }
    const discountAmount = appliedCoupons.reduce((sum, c) => sum + c.discountAmount, 0)

    const shippingFee = await calculateShippingFee(subtotal, tx)
    const total = Math.max(subtotal - discountAmount, 0) + shippingFee

    if (input.saveAddress && ctx.userId) {
      await tx.address.updateMany({ where: { userId: ctx.userId }, data: { isDefault: false } })
      await tx.address.create({
        data: {
          userId: ctx.userId,
          fullName: input.recipientName,
          phone: input.recipientPhone,
          province: input.province,
          district: input.district,
          ward: input.ward,
          addressLine: input.addressLine,
          note: input.note,
          isDefault: true,
        },
      })
    }

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: ctx.userId,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        total: total.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        paymentMethod: input.paymentMethod,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        province: input.province,
        district: input.district,
        ward: input.ward,
        addressLine: input.addressLine,
        note: input.note,
        addressId: input.addressId,
        items: { createMany: { data: orderItemsData } },
        coupons: appliedCoupons.length
          ? { createMany: { data: appliedCoupons.map(c => ({ couponId: c.couponId, couponCode: c.couponCode, discountAmount: c.discountAmount.toFixed(2) })) } }
          : undefined,
        payment: { create: { method: input.paymentMethod, amount: total.toFixed(2) } },
        shipping: { create: { fee: shippingFee.toFixed(2) } },
      },
      include: orderInclude,
    })

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    return order
  })
}

export async function listOrders(
  ctx: OrderContext,
  opts: { page: number, limit: number, status?: OrderStatus },
) {
  const where: Prisma.OrderWhereInput = {}
  if (!ctx.isAdmin) {
    if (!ctx.userId) throw Errors.unauthorized()
    where.userId = ctx.userId
  }
  if (opts.status) where.status = opts.status

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    data,
    meta: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    },
  }
}

export async function getOrderById(id: string, ctx: OrderContext & { guestAccessGranted?: boolean }) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude })
  if (!order) throw Errors.notFound('Không tìm thấy đơn hàng')

  const ownedByUser = Boolean(ctx.userId) && order.userId === ctx.userId
  const ownedByGuestSession = !order.userId && ctx.guestAccessGranted
  if (!ctx.isAdmin && !ownedByUser && !ownedByGuestSession) {
    throw Errors.forbidden('Bạn không có quyền xem đơn hàng này')
  }

  return order
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw Errors.notFound('Không tìm thấy đơn hàng')
  return prisma.order.update({ where: { id }, data: { status }, include: orderInclude })
}
