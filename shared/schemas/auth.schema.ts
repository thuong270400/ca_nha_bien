import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  phone: z.string().trim().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ').optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120).optional(),
  phone: z.string().trim().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ').optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
