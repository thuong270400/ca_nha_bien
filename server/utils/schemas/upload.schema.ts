import { z } from 'zod'

export const deleteUploadSchema = z.object({
  url: z.string().trim().min(1).max(1000),
})

export type DeleteUploadInput = z.infer<typeof deleteUploadSchema>
