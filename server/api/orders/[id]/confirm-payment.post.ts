import { confirmBankTransferPayment } from '../../../services/order.service'

// Admin xác nhận thủ công đã nhận chuyển khoản — fallback cho khi webhook
// SePay (POST /api/webhooks/sepay) không tự khớp được giao dịch (xem
// CLAUDE.md, mục Payments).
export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  return confirmBankTransferPayment(id)
})
