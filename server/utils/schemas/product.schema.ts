import { z } from 'zod'
import { boolQuery, paginationSchema, slugSchema } from './common.schema'

/** Shared with `Category.defaultSort` (see category.schema.ts) — same vocabulary powers both. */
export const productSortSchema = z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'stock_asc', 'stock_desc', 'best_selling'])

export const productVariantSchema = z.object({
  id: z.string().optional(),
  unit: z.string().trim().min(1, 'Đơn vị bán không được để trống').max(40),
  price: z.coerce.number().positive('Giá phải lớn hơn 0'),
  compareAtPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
}).refine(v => v.compareAtPrice === undefined || v.compareAtPrice > v.price, {
  message: 'Giá so sánh (giá gốc) phải lớn hơn giá bán',
  path: ['compareAtPrice'],
})

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().min(1, 'URL ảnh không được để trống').max(1000),
  alt: z.string().trim().max(200).optional(),
  position: z.number().int().optional(),
})

export const productStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, 'Tên sản phẩm không được để trống').max(200),
  slug: slugSchema,
  description: z.string().trim().max(5000).optional(),
  origin: z.string().trim().max(200).optional(),
  status: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  categoryIds: z.array(z.string().trim().min(1)).min(1, 'Vui lòng chọn ít nhất 1 danh mục'),
  images: z.array(productImageSchema).optional(),
  variants: z.array(productVariantSchema).min(1, 'Cần ít nhất 1 biến thể (đơn vị bán)'),
  tagIds: z.array(z.string()).optional(),
})

export const productUpdateSchema = productCreateSchema.partial().extend({
  variants: z.array(productVariantSchema).optional(),
})

export const productListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().optional(),
  /** Comma-separated list of ProductVariant.unit values, e.g. "kg,500g". */
  unit: z.string().trim().optional(),
  /** Comma-separated list of Tag.slug values. */
  tags: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: boolQuery.optional(),
  status: productStatusSchema.optional(),
  featured: boolQuery.optional(),
  sort: productSortSchema.default('newest'),
})

export const productSuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
