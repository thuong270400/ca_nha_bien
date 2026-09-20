import type { OrderStatus, PaymentMethod, PaymentStatus } from '#shared/types/order'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng (VietQR)',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  DEPOSIT_PAID: 'Đã đặt cọc',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
}

export const paymentStatusColors: Record<PaymentStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  DEPOSIT_PAID: 'info',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'neutral',
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã huỷ',
}

export const orderStatusColors: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'primary'> = {
  PENDING: 'neutral',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  SHIPPING: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
}

export const orderStatusFlow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED']
