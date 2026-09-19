export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'ZALOPAY'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

/** Snapshot của thông tin ngân hàng (Setting) tại thời điểm tạo đơn — QR VietQR luôn dựng từ đây. */
export interface PaymentBankSnapshot {
  bankTransferEnabled: boolean
  bankName: string | null
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
}

export interface OrderItemView {
  id: string
  orderId: string
  productId: string
  variantId: string
  productName: string
  unit: string
  price: string
  quantity: number
  lineTotal: string
}

export interface PaymentView {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  transactionId: string | null
  paidAt: string | null
  bankSnapshot: PaymentBankSnapshot | null
}

export interface ShippingView {
  id: string
  orderId: string
  carrier: string | null
  trackingNumber: string | null
  fee: string
  shippedAt: string | null
  deliveredAt: string | null
}

export interface OrderCouponView {
  id: string
  couponId: string | null
  couponCode: string
  discountAmount: string
}

export interface OrderView {
  id: string
  orderNumber: string
  userId: string | null
  status: OrderStatus
  subtotal: string
  shippingFee: string
  total: string
  discountAmount: string
  /** % cọc cao nhất trong đơn — null/0 nghĩa là không có sản phẩm nào cần cọc. Chỉ là cờ đánh dấu, không đổi `total`/`payment.amount`. */
  depositPercent: number | null
  /** Số ngày dự kiến giao hàng dài nhất trong đơn — null nghĩa là không sản phẩm nào khai báo. */
  estimatedAvailabilityDays: number | null
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  recipientName: string
  recipientPhone: string
  province: string
  district: string
  ward: string
  addressLine: string
  note: string | null
  addressId: string | null
  createdAt: string
  updatedAt: string
  items: OrderItemView[]
  coupons: OrderCouponView[]
  payment: PaymentView | null
  shipping: ShippingView | null
}

export interface AddressView {
  id: string
  userId: string
  fullName: string
  phone: string
  province: string
  district: string
  ward: string
  addressLine: string
  note: string | null
  isDefault: boolean
}
