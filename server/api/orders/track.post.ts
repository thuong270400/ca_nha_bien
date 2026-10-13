import { trackOrderSchema } from '#shared/schemas/order.schema'
import { findOrderIdForTracking } from '../../services/order.service'

// Tra cứu đơn công khai: khớp mã đơn + SĐT người nhận thì cấp quyền xem qua
// cookie guest_order_ids (cùng cơ chế với khách vãng lai vừa đặt hàng), rồi
// frontend chuyển sang /order/:id như bình thường.
export default defineApiHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  checkRateLimit(`order-track:${ip}`, { max: 10, windowMs: 15 * 60_000 })

  const input = await readValidatedBody(event, trackOrderSchema.parse)
  const id = await findOrderIdForTracking(input)
  addGuestOrderId(event, id)
  return { id }
})
