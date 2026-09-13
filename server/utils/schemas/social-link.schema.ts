import { z } from 'zod'

const socialLinkBaseSchema = z.object({
  label: z.string().trim().max(60).optional(),
  url: z.string().trim().min(1, 'URL không được để trống').max(1000),
  iconType: z.enum(['PRESET', 'CUSTOM']).default('PRESET'),
  iconKey: z.string().trim().max(60).nullable().optional(),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  displayLocation: z.enum(['FOOTER', 'FIXED']).default('FOOTER'),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'XXLARGE']).default('MEDIUM'),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const socialLinkCreateSchema = socialLinkBaseSchema.refine(
  data => data.iconType !== 'PRESET' || !!data.iconKey,
  { message: 'Vui lòng chọn icon có sẵn', path: ['iconKey'] },
).refine(
  data => data.iconType !== 'CUSTOM' || !!data.imageUrl,
  { message: 'Vui lòng tải ảnh icon lên', path: ['imageUrl'] },
)

export const socialLinkUpdateSchema = socialLinkBaseSchema.partial()

export type SocialLinkCreateInput = z.infer<typeof socialLinkCreateSchema>
export type SocialLinkUpdateInput = z.infer<typeof socialLinkUpdateSchema>
