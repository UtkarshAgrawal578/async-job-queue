import { prisma } from '@/lib/db'
import { jobItemQueue } from '@/lib/queue'
import { toJobItemDTO } from '@/types'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params

  const item = await prisma.jobItem.findUnique({
    where: { id: itemId },
  })

  if (!item) {
    return NextResponse.json({ error: 'Job item not found' }, { status: 404 })
  }

  if (item.status !== 'failed') {
    return NextResponse.json(
      { error: `Only failed items can be retried. Current status: ${item.status}` },
      { status: 409 }
    )
  }

  // 1. Reset the item back to pending, clear the previous error.
  const updatedItem = await prisma.jobItem.update({
    where: { id: itemId },
    data: {
      status: 'pending',
      error: null,
    },
  })

  // 2. If the parent job had already been marked "completed" (because every
  //    item was previously done), flip it back to "running" since there's
  //    now pending work again.
  await prisma.job.update({
    where: { id: item.jobId },
    data: { status: 'running' },
  })

  // 3. Re-enqueue just this one item — the rest of the batch is untouched.
  await jobItemQueue.add('process-item', {
    jobItemId: updatedItem.id,
    jobId: updatedItem.jobId,
  })

  return NextResponse.json(toJobItemDTO(updatedItem), { status: 200 })
}