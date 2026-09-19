// src/app/api/jobs/[jobId]/route.ts
import { prisma } from '@/lib/db'
import { toJobDTO } from '@/types'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { items: { orderBy: { index: 'asc' } } },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(toJobDTO(job))
}