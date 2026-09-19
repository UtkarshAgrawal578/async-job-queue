import { prisma } from '@/lib/db'
import { toJobDTO } from '@/types'
import { NextRequest } from 'next/server'


const CHECK_INTERVAL_MS = 1000

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const encoder = new TextEncoder()
  let lastSnapshot = ''
  let intervalId: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        try {
          const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { items: true },
          })

          if (!job) {
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`)
            )
            clearInterval(intervalId)
            controller.close()
            return
          }

          const dto = toJobDTO(job)
          const snapshot = JSON.stringify(dto)

          // Only push a new SSE event if something actually changed —
          // this is what keeps the connection cheap even though we check every second.
          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot
            controller.enqueue(encoder.encode(`data: ${snapshot}\n\n`))
          }

          // Once the whole batch is done, send a final event and close the stream.
          if (job.status === 'completed') {
            controller.enqueue(encoder.encode(`event: done\ndata: ${snapshot}\n\n`))
            clearInterval(intervalId)
            controller.close()
          }
        } catch (err) {
          console.error('[SSE] error fetching job:', err)
        }
      }

      // Send the current state immediately, then check for changes on an interval.
      sendUpdate()
      intervalId = setInterval(sendUpdate, CHECK_INTERVAL_MS)
    },
    cancel() {
      // Client disconnected (closed tab, navigated away) — clean up.
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}