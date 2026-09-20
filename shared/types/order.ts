export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'ZALOPAY'
export type PaymentStatus = 'PENDING' | 'DEPOSIT_PAID' | 'PAID' | 'FAILED' | 'REFUNDED'

/** Snapshot của thông tin ngân hàng (Setting) tại thời điểm tạo đơn — QR VietQR luôn dựng từ đây. */
export interface PaymentBankSnapshot {
  bankTransferEnabled: boolean
  bankName: string | null
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
}

export type OrderDeliveryMode = 'SINGLE' | 'SPLIT'

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
  availabilityFromDays: number | null
  availabilityToDays: number | null
}

export interface PaymentView {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  /** Số tiền cọc cần thu trước qua chuyển khoản — null nghĩa là đơn không tách cọc, thu đủ `amount` luôn. */
  depositAmount: string | null
  depositPaidAt: string | null
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
  /** % cọc áp dụng cho đơn — null/0 nghĩa là không cần cọc. Với BANK_TRANSFER, đây là % dùng để tính `payment.depositAmount` (thu trước thật qua QR); với COD chỉ là cờ đánh dấu, không đổi `total`. */
  depositPercent: number | null
  /** Số ngày dự kiến giao hàng dài nhất trong đơn — null nghĩa là không sản phẩm nào khai báo. */
  estimatedAvailabilityDays: number | null
  /** Khách chọn ở checkout khi giỏ hàng có nhiều khoảng ngày dự kiến có cá khác nhau. */
  deliveryMode: OrderDeliveryMode
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
