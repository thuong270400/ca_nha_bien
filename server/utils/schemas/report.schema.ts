import { z } from 'zod'

export const reportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  groupBy: z.enum(['day', 'month']).default('day'),
}).refine(v => v.from <= v.to, {
  message: 'Khoảng thời gian không hợp lệ',
  path: ['to'],
})

export type ReportQuery = z.infer<typeof reportQuerySchema>
