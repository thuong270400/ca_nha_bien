import type { CreateOrderInput } from '#shared/schemas/order.schema'
import { resolveAvailabilityDays } from '#shared/utils/sourcing'
import type { SepayWebhookPayload } from '../utils/schemas/sepay.schema'
import { validateCoupon } from './coupon.service'
import { getBankSettings, getDepositSettings } from './setting.service'
import { Prisma } from '../generated/prisma/client'
import type { OrderStatus, PaymentStatus } from '../generated/prisma/enums'
import { Errors } from '../utils/errors'
import { extractOrderNumber, generateOrderNumber } from '../utils/order-number'
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
    // Thời gian giao dự kiến của đơn (deliveryMode = SINGLE) = "xấu nhất" (chờ
    // lâu nhất) trong số ngày dự kiến có cá của mọi sản phẩm trong giỏ, dùng max
    // để không đánh giá thấp thời gian chờ thực tế. Sản phẩm chưa nhập số ngày
    // đóng góp mức mặc định "hàng có sẵn" (xem resolveAvailabilityDays). Số ngày
    // của từng item cũng được snapshot vào OrderItem để nhóm đợt giao khi khách
    // chọn deliveryMode = SPLIT (xem groupByAvailabilityDays).
    let estimatedAvailabilityDays: number | null = null

    for (const item of cart.items) {
      if (item.product.deletedAt || item.product.status !== 'ACTIVE') {
        throw Errors.badRequest(`Sản phẩm "${item.product.name}" hiện không kinh doanh, vui lòng xoá khỏi giỏ hàng`)
      }
      const lineTotal = Number(item.variant.price) * item.quantity
      subtotal += lineTotal
      const availabilityDays = resolveAvailabilityDays(item.product.availabilityDays)
      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        unit: item.variant.unit,
        price: item.variant.price,
        quantity: item.quantity,
        lineTotal: lineTotal.toFixed(2),
        availabilityDays,
      })

      if (availabilityDays > 0 && (estimatedAvailabilityDays === null || availabilityDays > estimatedAvailabilityDays)) {
        estimatedAvailabilityDays = availabilityDays
      }
    }

    // % cọc áp dụng chung cho mọi sản phẩm (Setting.depositPercent, cấu hình ở
    // trang Cài đặt) — snapshot vào Order.depositPercent, không đổi theo khi
    // admin sửa cài đặt sau này. Không đổi Payment.amount/total.
    const { depositPercent: globalDepositPercent } = await getDepositSettings(tx)
    const depositPercent = globalDepositPercent > 0 ? globalDepositPercent : null

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

    let bankSnapshot: Prisma.InputJsonValue | undefined
    // % cọc chỉ thu trước thật (giảm số tiền trên QR) với BANK_TRANSFER — COD
    // không có cơ chế thu trước khi giao, nên vẫn chỉ là cờ đánh dấu như cũ.
    // depositPercent >= 100 coi như không tách cọc (thu đủ luôn, còn lại = 0
    // thì tách 2 bước không có ý nghĩa gì).
    let depositAmount: number | null = null
    if (input.paymentMethod === 'BANK_TRANSFER') {
      const bank = await getBankSettings(tx)
      if (!bank.bankTransferEnabled || !bank.bankCode || !bank.bankAccountNumber) {
        throw Errors.badRequest('Phương thức chuyển khoản ngân hàng hiện không khả dụng')
      }
      bankSnapshot = bank
      if (depositPercent && depositPercent < 100) {
        depositAmount = Math.round(total * depositPercent / 100)
      }
    }

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
        depositPercent,
        estimatedAvailabilityDays,
        deliveryMode: input.deliveryMode,
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
        payment: { create: { method: input.paymentMethod, amount: total.toFixed(2), depositAmount: depositAmount !== null ? depositAmount.toFixed(2) : undefined, bankSnapshot } },
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

type SettleablePayment = { id: string, status: PaymentStatus, amount: Prisma.Decimal, depositAmount: Prisma.Decimal | null }

/**
 * Đơn có tách cọc (Payment.depositAmount != null) xác nhận theo 2 bước tuần tự:
 * PENDING -> DEPOSIT_PAID (nhận đủ tiền cọc) -> PAID (nhận đủ phần còn lại).
 * Đơn không tách cọc chỉ có 1 bước PENDING -> PAID như cũ. Trả về null nếu
 * payment đã ở bước cuối (PAID) hoặc ở trạng thái không xác nhận được (FAILED/
 * REFUNDED) — không có bước tiếp theo.
 */
function resolveNextPaymentStep(payment: Pick<SettleablePayment, 'status' | 'depositAmount'>): { toStatus: 'DEPOSIT_PAID' | 'PAID', expectedAmount: (p: SettleablePayment) => number } | null {
  if (payment.status === 'PENDING') {
    return payment.depositAmount !== null
      ? { toStatus: 'DEPOSIT_PAID', expectedAmount: p => Number(p.depositAmount) }
      : { toStatus: 'PAID', expectedAmount: p => Number(p.amount) }
  }
  if (payment.status === 'DEPOSIT_PAID') {
    return { toStatus: 'PAID', expectedAmount: p => Number(p.amount) - Number(p.depositAmount ?? 0) }
  }
  return null
}

/**
 * Atomic transition (PENDING -> DEPOSIT_PAID hoặc PENDING/DEPOSIT_PAID -> PAID)
 * dùng chung bởi nút xác nhận thủ công của admin và webhook SePay tự động —
 * mirrors the stock-decrement guard in attemptCreateOrder so a double-confirm
 * (2 admin clicks, hoặc SePay gửi lại webhook) là no-op an toàn thay vì race.
 * Trả về null nếu payment đã rời khỏi `fromStatus` trước khi hàm này chạy.
 */
async function settlePayment(
  payment: { id: string, status: PaymentStatus },
  order: { id: string, status: OrderStatus },
  toStatus: 'DEPOSIT_PAID' | 'PAID',
  opts: { at: Date, transactionId?: string },
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: payment.status },
      data: {
        status: toStatus,
        ...(toStatus === 'DEPOSIT_PAID' ? { depositPaidAt: opts.at } : { paidAt: opts.at }),
        ...(opts.transactionId ? { transactionId: opts.transactionId } : {}),
      },
    })
    if (updated.count === 0) return null

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: toStatus,
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
      },
      include: orderInclude,
    })
  })
}

/**
 * Admin xác nhận thủ công đã nhận chuyển khoản — fallback khi webhook SePay
 * (confirmBankTransferPaymentFromSepay) không tự khớp được giao dịch (vd nội
 * dung chuyển khoản bị khách xoá/sửa, sai số tiền). Tự nhận diện đang ở bước
 * cọc hay bước còn lại dựa vào status hiện tại (xem resolveNextPaymentStep).
 */
export async function confirmBankTransferPayment(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } })
  if (!order || !order.payment) throw Errors.notFound('Không tìm thấy đơn hàng')
  if (order.payment.method !== 'BANK_TRANSFER') throw Errors.badRequest('Đơn hàng này không sử dụng thanh toán chuyển khoản')

  const step = resolveNextPaymentStep(order.payment)
  if (!step) throw Errors.badRequest('Đơn hàng đã được xử lý thanh toán')

  const updated = await settlePayment(order.payment, order, step.toStatus, { at: new Date() })
  if (!updated) throw Errors.conflict('Đơn hàng vừa được xử lý thanh toán ở nơi khác')
  return updated
}

export type SepayMatchResult =
  | { matched: true }
  | { matched: false, reason: 'no-order-number-found' | 'order-not-found' | 'not-bank-transfer' | 'account-mismatch' | 'amount-mismatch' }

/**
 * Đối chiếu 1 giao dịch webhook SePay với đơn hàng và tự xác nhận thanh toán
 * nếu khớp — thay cho việc admin phải tự kiểm tra tài khoản ngân hàng và bấm
 * xác nhận thủ công. Đơn hàng được tìm qua mã đơn (ORD-YYYYMMDD-NNNN) trích
 * từ `code` (SePay đã tách theo tiền tố cấu hình ở dashboard) hoặc từ
 * `content`/`description` gốc của ngân hàng — rồi đối chiếu lại số tài khoản
 * nhận tiền (snapshot lúc tạo đơn) và số tiền trước khi xác nhận, không tin
 * riêng mã đơn. Đơn có tách cọc (Payment.depositAmount) đối chiếu số tiền theo
 * đúng bước hiện tại (cọc trước, hay phần còn lại — xem resolveNextPaymentStep)
 * chứ không so với `amount` đầy đủ. Không khớp được thì bỏ qua (log lại ở route
 * gọi hàm này), admin vẫn xác nhận thủ công được qua confirmBankTransferPayment.
 */
export async function confirmBankTransferPaymentFromSepay(payload: SepayWebhookPayload): Promise<SepayMatchResult> {
  const orderNumber = extractOrderNumber(payload.code) ?? extractOrderNumber(payload.content) ?? extractOrderNumber(payload.description)
  if (!orderNumber) return { matched: false, reason: 'no-order-number-found' }

  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { payment: true } })
  if (!order || !order.payment) return { matched: false, reason: 'order-not-found' }
  if (order.paymentMethod !== 'BANK_TRANSFER') return { matched: false, reason: 'not-bank-transfer' }

  const snapshot = order.payment.bankSnapshot as { bankAccountNumber?: string | null } | null
  if (!snapshot?.bankAccountNumber || snapshot.bankAccountNumber !== payload.accountNumber) {
    return { matched: false, reason: 'account-mismatch' }
  }

  // Đã xử lý xong bước cuối (PAID) rồi, hoặc ở trạng thái FAILED/REFUNDED — vẫn
  // coi là khớp (admin xác nhận tay trước, hoặc SePay gửi lại webhook), chỉ là
  // không cần settlePayment nữa.
  const step = resolveNextPaymentStep(order.payment)
  if (!step) return { matched: true }

  if (step.expectedAmount(order.payment) !== payload.transferAmount) {
    return { matched: false, reason: 'amount-mismatch' }
  }

  const paidAt = new Date(payload.transactionDate.replace(' ', 'T') + '+07:00')
  await settlePayment(order.payment, order, step.toStatus, {
    at: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    transactionId: `sepay:${payload.id}`,
  })
  return { matched: true }
}
