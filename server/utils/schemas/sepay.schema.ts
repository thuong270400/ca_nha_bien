import { z } from 'zod'

// Payload SePay POST tới webhook mỗi khi có giao dịch khớp cấu hình — xem
// https://docs.sepay.vn/tich-hop-webhooks.html. `id` là khoá chống trùng khi
// SePay retry (không đổi qua các lần gửi lại).
export const sepayWebhookSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  subAccount: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  content: z.string().optional().default(''),
  transferType: z.enum(['in', 'out']),
  description: z.string().optional().default(''),
  transferAmount: z.number(),
  accumulated: z.number().optional().default(0),
  referenceCode: z.string().optional().default(''),
})

export type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>
