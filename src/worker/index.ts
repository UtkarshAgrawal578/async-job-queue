import { Worker, Job as BullJob } from 'bullmq'
import { connection } from '../lib/redis'
import { prisma } from '../lib/db'
import { QUEUE_NAME, type JobItemPayload } from '../lib/queue'

const MIN_DELAY_MS = 1000
const MAX_DELAY_MS = 5000
const FAILURE_RATE = 0.3 // 30% of items randomly fail, for demo purposes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
}

/**
 * After finishing a single item, check whether the whole batch is done,
 * and if so, roll the parent Job's status up to "completed".
 */
async function maybeCompleteJob(jobId: string) {
  const remaining = await prisma.jobItem.count({
    where: { jobId, status: { in: ['pending', 'running'] } },
  })

  if (remaining === 0) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'completed' },
    })
  }
}

async function processItem(job: BullJob<JobItemPayload>) {
  const { jobItemId, jobId } = job.data

  // Mark as running before starting the fake work
  await prisma.jobItem.update({
    where: { id: jobItemId },
    data: { status: 'running' },
  })

  await sleep(randomDelay())

  const didSucceed = Math.random() > FAILURE_RATE

  await prisma.jobItem.update({
    where: { id: jobItemId },
    data: {
      status: didSucceed ? 'success' : 'failed',
      attempts: { increment: 1 },
      error: didSucceed ? null : 'Simulated random failure',
    },
  })

  await maybeCompleteJob(jobId)
}

const worker = new Worker<JobItemPayload>(QUEUE_NAME, processItem, {
  connection,
  concurrency: 5, // process up to 5 items in parallel
})

worker.on('completed', (job) => {
  console.log(`[worker] item ${job.data.jobItemId} finished`)
})

worker.on('failed', (job, err) => {
  console.error(`[worker] item ${job?.data.jobItemId} threw an error:`, err)
})

console.log('[worker] listening for job-items...')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[worker] shutting down...')
  await worker.close()
  process.exit(0)
})