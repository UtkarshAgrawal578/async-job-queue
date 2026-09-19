// src/components/JobDashboard.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { JobDTO } from '@/types'
import { JobItemRow } from './JobItemRow'

interface JobDashboardProps {
  jobId: string
}

export function JobDashboard({ jobId }: JobDashboardProps) {
  const [job, setJob] = useState<JobDTO | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    setJob(null)
    setConnectionError(null)

    const es = new EventSource(`/api/jobs/${jobId}/stream`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data: JobDTO = JSON.parse(event.data)
      setJob(data)
    }

    es.addEventListener('done', (event: MessageEvent) => {
      const data: JobDTO = JSON.parse(event.data)
      setJob(data)
      es.close()
    })

    es.addEventListener('error', () => {
      setConnectionError('Lost connection to live updates. Refresh to reconnect.')
      es.close()
    })

    return () => {
      es.close()
    }
  }, [jobId])

  async function handleRetry(itemId: string) {
    await fetch(`/api/job-items/${itemId}/retry`, { method: 'POST' })
    if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
      const es = new EventSource(`/api/jobs/${jobId}/stream`)
      eventSourceRef.current = es
      es.onmessage = (event) => setJob(JSON.parse(event.data))
      es.addEventListener('done', (event: MessageEvent) => {
        setJob(JSON.parse(event.data))
        es.close()
      })
    }
  }

  if (connectionError) {
    return <p style={{ color: 'var(--color-failed)' }}>{connectionError}</p>
  }

  if (!job) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Loading job...</p>
  }

  const succeeded = job.items.filter((i) => i.status === 'success').length
  const failed = job.items.filter((i) => i.status === 'failed').length
  const completed = succeeded + failed

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total" value={job.items.length} color="var(--color-text)" />
        <StatCard label="Completed" value={completed} color="var(--color-brand)" />
        <StatCard label="Succeeded" value={succeeded} color="var(--color-success)" />
        <StatCard label="Failed" value={failed} color="var(--color-failed)" />
        <StatCard label="Status" value={job.status} color="var(--color-running)" />
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {job.items.map((item) => (
          <JobItemRow key={item.id} item={item} onRetry={handleRetry} />
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-1"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="font-display text-xl font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}