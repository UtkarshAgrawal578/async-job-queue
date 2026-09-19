// src/types/index.ts
import type { Job, JobItem, JobStatus, JobItemStatus } from '@prisma/client'

export type { JobStatus, JobItemStatus }

export interface JobItemDTO {
  id: string
  jobId: string
  index: number
  status: JobItemStatus
  attempts: number
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface JobDTO {
  id: string
  count: number
  status: JobStatus
  createdAt: string
  updatedAt: string
  items: JobItemDTO[]
}

export interface JobSummary {
  id: string
  count: number
  status: JobStatus
  total: number
  completed: number // success + failed (i.e. no longer pending/running)
  succeeded: number
  failed: number
}

// Helper to convert Prisma's Date objects into JSON-safe strings
export function toJobItemDTO(item: JobItem): JobItemDTO {
  return {
    id: item.id,
    jobId: item.jobId,
    index: item.index,
    status: item.status,
    attempts: item.attempts,
    error: item.error,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function toJobDTO(job: Job & { items: JobItem[] }): JobDTO {
  return {
    id: job.id,
    count: job.count,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    items: job.items.map(toJobItemDTO),
  }
}

export function toJobSummary(job: Job & { items: JobItem[] }): JobSummary {
  const succeeded = job.items.filter((i) => i.status === 'success').length
  const failed = job.items.filter((i) => i.status === 'failed').length
  return {
    id: job.id,
    count: job.count,
    status: job.status,
    total: job.items.length,
    completed: succeeded + failed,
    succeeded,
    failed,
  }
}