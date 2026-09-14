import { z } from 'zod'

export const bannerButtonSchema = z.object({
  label: z.string().trim().min(1, 'Nhãn nút không được để trống').max(60),
  link: z.string().trim().min(1, 'Liên kết nút không được để trống').max(500),
  position: z.number().int().optional(),
})

export const bannerCreateSchema = z.object({
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  title: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(500).optional(),
  buttons: z.array(bannerButtonSchema).optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const bannerUpdateSchema = bannerCreateSchema.partial()

export type BannerButtonInput = z.infer<typeof bannerButtonSchema>
export type BannerCreateInput = z.infer<typeof bannerCreateSchema>
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>
