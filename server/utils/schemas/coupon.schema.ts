import { z } from 'zod'
import { boolQuery, paginationSchema } from './common.schema'

export const couponTypeSchema = z.enum(['PERCENTAGE', 'FIXED'])

export const couponCreateSchema = z.object({
  code: z.string().trim().min(3, 'Mã tối thiểu 3 ký tự').max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, gạch ngang, gạch dưới')
    .transform(v => v.toUpperCase()),
  type: couponTypeSchema,
  value: z.coerce.number().positive('Giá trị phải lớn hơn 0'),
  minOrderValue: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  categoryId: z.string().trim().min(1, 'Vui lòng chọn danh mục mã giảm giá'),
}).refine(v => v.type !== 'PERCENTAGE' || v.value <= 100, {
  message: 'Phần trăm giảm giá tối đa 100',
  path: ['value'],
}).refine(v => !v.startsAt || !v.expiresAt || v.startsAt < v.expiresAt, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['expiresAt'],
})

export const couponUpdateSchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ, số, gạch ngang, gạch dưới').transform(v => v.toUpperCase()).optional(),
  type: couponTypeSchema.optional(),
  value: z.coerce.number().positive('Giá trị phải lớn hơn 0').optional(),
  minOrderValue: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  categoryId: z.string().trim().min(1, 'Vui lòng chọn danh mục mã giảm giá').optional(),
}).refine(v => v.type !== 'PERCENTAGE' || v.value === undefined || v.value <= 100, {
  message: 'Phần trăm giảm giá tối đa 100',
  path: ['value'],
})

export const couponListQuerySchema = paginationSchema.extend({
  q: z.string().trim().optional(),
  isActive: boolQuery.optional(),
})

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá'),
})

export type CouponCreateInput = z.infer<typeof couponCreateSchema>
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>
export type CouponListQuery = z.infer<typeof couponListQuerySchema>
