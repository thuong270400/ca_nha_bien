import { paymentStatusUpdateSchema } from '#shared/schemas/order.schema'
import { updatePaymentStatus } from '../../../services/order.service'

// Admin chỉnh tay trạng thái thanh toán — khác confirm-payment (chỉ xác nhận
// bước chuyển khoản đang chờ), endpoint này đặt thẳng mọi trạng thái.
export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, paymentStatusUpdateSchema.parse)
  return updatePaymentStatus(id, input.paymentStatus)
})
