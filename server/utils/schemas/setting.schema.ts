import { z } from 'zod'

export const settingUpdateSchema = z.object({
  shippingFee: z.coerce.number().nonnegative('Phí vận chuyển phải lớn hơn hoặc bằng 0'),
  freeShippingThreshold: z.coerce.number().nonnegative('Ngưỡng miễn phí vận chuyển phải lớn hơn hoặc bằng 0'),
})

export type SettingUpdateInput = z.infer<typeof settingUpdateSchema>
