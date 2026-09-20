import { z } from 'zod'
import { slugSchema } from './common.schema'

const sourcingClassificationShape = {
  name: z.string().trim().min(1, 'Tên phân loại không được để trống').max(100),
  slug: slugSchema,
  catchProcess: z.string().trim().max(2000).optional(),
  availabilityFromDays: z.coerce.number().int().min(0).optional(),
  availabilityToDays: z.coerce.number().int().min(0).optional(),
  position: z.number().int().optional(),
}

// Same range check applied to both create (full shape) and update (partial shape).
export const sourcingClassificationCreateSchema = z.object(sourcingClassificationShape)
  .refine(v => v.availabilityFromDays === undefined || v.availabilityToDays === undefined || v.availabilityToDays >= v.availabilityFromDays, {
    message: 'Số ngày "đến" phải lớn hơn hoặc bằng số ngày "từ"',
    path: ['availabilityToDays'],
  })

export const sourcingClassificationUpdateSchema = z.object(sourcingClassificationShape).partial()
  .refine(v => v.availabilityFromDays === undefined || v.availabilityToDays === undefined || v.availabilityToDays >= v.availabilityFromDays, {
    message: 'Số ngày "đến" phải lớn hơn hoặc bằng số ngày "từ"',
    path: ['availabilityToDays'],
  })

export type SourcingClassificationCreateInput = z.infer<typeof sourcingClassificationCreateSchema>
export type SourcingClassificationUpdateInput = z.infer<typeof sourcingClassificationUpdateSchema>
