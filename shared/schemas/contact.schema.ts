import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  email: z.string().trim().email('Email không hợp lệ').max(200),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(2000),
})

export type ContactInput = z.infer<typeof contactSchema>
