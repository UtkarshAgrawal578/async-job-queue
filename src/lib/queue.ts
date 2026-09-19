import { Queue } from 'bullmq'
import { connection } from './redis'

export const QUEUE_NAME = 'job-items'

export const jobItemQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 1, // we handle retries manually via the "retry" endpoint, not BullMQ's auto-retry
    removeOnComplete: true, 
    removeOnFail: false, 
  },
})

// Payload shape sent to the queue for each sub-job
export interface JobItemPayload {
  jobItemId: string
  jobId: string
}