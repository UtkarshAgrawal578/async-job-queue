// src/lib/validators.ts
import { z } from 'zod'

export const createJobSchema = z.object({
  count: z
    .number()
    .int()
    .min(1, 'count must be at least 1')
    .max(500, 'count cannot exceed 500'),
})

export type CreateJobInput = z.infer<typeof createJobSchema>