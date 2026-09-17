import { confirmBankTransferPaymentFromSepay } from '../../services/order.service'
import { sepayWebhookSchema } from '../../utils/schemas/sepay.schema'

// SePay gọi endpoint này mỗi khi có giao dịch chuyển khoản khớp cấu hình
// webhook (Company -> Webhooks trên dashboard SePay, trỏ về URL này — xem
// verifySepayWebhook cho 2 cách xác thực hỗ trợ). Luôn trả {success:true} +
// 200 sau khi xác thực xong, kể cả khi không khớp được đơn hàng nào — retry
// theo lịch backoff của SePay không giúp gì cho các trường hợp không khớp
// (sai số tiền, nội dung chuyển khoản thiếu mã đơn...), nên xử lý 1 lần rồi
// log lại cho admin xác nhận thủ công thay vì để SePay dội lại trong 5 giờ.
export default defineApiHandler(async (event) => {
  await verifySepayWebhook(event)
  const payload = await readValidatedBody(event, sepayWebhookSchema.parse)

  if (payload.transferType === 'in') {
    const result = await confirmBankTransferPaymentFromSepay(payload)
    if (!result.matched) {
      console.warn(`[sepay webhook] không khớp đơn hàng (id=${payload.id}, reason=${result.reason})`)
    }
  }

  return { success: true }
})
