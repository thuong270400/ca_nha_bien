import type { OrderStatus } from '#shared/types/order'

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
