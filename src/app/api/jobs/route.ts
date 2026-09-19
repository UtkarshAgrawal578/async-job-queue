// src/app/api/jobs/route.ts
import { prisma } from '@/lib/db'
import { jobItemQueue } from '@/lib/queue'
import { createJobSchema } from '@/lib/validators'
import { toJobDTO } from '@/types'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createJobSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { count } = parsed.data

  // 1. Create the Job + N JobItems in a single DB transaction.
  const job = await prisma.job.create({
    data: {
      count,
      status: 'pending',
      items: {
        create: Array.from({ length: count }, (_, index) => ({
          index,
          status: 'pending' as const,
        })),
      },
    },
    include: { items: true },
  })

  // 2. Push each item onto the BullMQ queue.
  //    We do NOT process anything here — the worker (a separate process)
  //    picks these up and does the actual (fake) work asynchronously.
  await jobItemQueue.addBulk(
    job.items.map((item) => ({
      name: 'process-item',
      data: { jobItemId: item.id, jobId: job.id },
    }))
  )

  // 3. Mark the job as "running" now that work has been dispatched.
  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: { status: 'running' },
    include: { items: true },
  })

  return NextResponse.json(toJobDTO(updatedJob), { status: 201 })
}

export async function GET() {
  // List all jobs, most recent first — useful for a history view on the dashboard.
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: 20,
  })

  return NextResponse.json(jobs.map(toJobDTO))
}