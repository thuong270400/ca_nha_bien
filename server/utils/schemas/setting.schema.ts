import { z } from 'zod'

export const settingUpdateSchema = z.object({
  shippingFee: z.coerce.number().nonnegative('Phí vận chuyển phải lớn hơn hoặc bằng 0'),
  freeShippingThreshold: z.coerce.number().nonnegative('Ngưỡng miễn phí vận chuyển phải lớn hơn hoặc bằng 0'),
  depositPercent: z.coerce.number().int().min(0).max(100).default(0),
  deliveryFromDays: z.coerce.number().int().min(0).optional().nullable(),
  deliveryToDays: z.coerce.number().int().min(0).optional().nullable(),
  bankTransferEnabled: z.boolean().default(false),
  bankName: z.string().trim().max(120).optional().nullable(),
  bankCode: z.string().trim().max(30).optional().nullable(),
  bankAccountNumber: z.string().trim().max(50).optional().nullable(),
  bankAccountName: z.string().trim().max(120).optional().nullable(),
}).refine(v => v.deliveryFromDays == null || v.deliveryToDays == null || v.deliveryToDays >= v.deliveryFromDays, {
  message: 'Số ngày "đến" phải lớn hơn hoặc bằng số ngày "từ"',
  path: ['deliveryToDays'],
})

export type SettingUpdateInput = z.infer<typeof settingUpdateSchema>
