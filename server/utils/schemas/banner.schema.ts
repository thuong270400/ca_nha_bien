import { z } from 'zod'

export const bannerCreateSchema = z.object({
  imageUrl: z.string().trim().min(1, 'URL ảnh không được để trống').max(1000),
  title: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(500).optional(),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaLink: z.string().trim().max(500).optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const bannerUpdateSchema = bannerCreateSchema.partial()

export type BannerCreateInput = z.infer<typeof bannerCreateSchema>
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>
