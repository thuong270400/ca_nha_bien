import { z } from 'zod'
import { boolQuery, slugSchema } from './common.schema'

/**
 * Thứ tự sắp xếp mặc định khi hiển thị sản phẩm của một danh mục (trang chủ
 * và trang danh mục) — tập con của `productSortSchema` ứng với 4 lựa chọn
 * admin cấu hình được: thời gian tạo, giá, chữ cái, tồn kho.
 */
export const categoryDefaultSortSchema = z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'stock_asc', 'stock_desc'])

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  homepageLimit: z.number().int().min(1, 'Giới hạn phải lớn hơn 0').nullable().optional(),
  position: z.number().int().optional(),
  defaultSort: categoryDefaultSortSchema.optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const categoryListQuerySchema = z.object({
  activeOnly: boolQuery.optional(),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
