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
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
        Connecting to live updates...
      </div>
    )
  }

  const succeeded = job.items.filter((i) => i.status === 'success').length
  const failed = job.items.filter((i) => i.status === 'failed').length
  const completed = succeeded + failed
  const total = job.items.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <span>{pct}% complete</span>
          <span className="capitalize font-medium" style={{ color: 'var(--color-text)' }}>
            {job.status}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex h-full transition-all duration-500">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (succeeded / total) * 100 : 0}%`,
                background: 'var(--color-success)',
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${total > 0 ? (failed / total) * 100 : 0}%`,
                background: 'var(--color-failed)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={total} icon="▤" color="var(--color-text)" bg="#F1F2F6" />
        <StatCard label="Succeeded" value={succeeded} icon="✓" color="var(--color-success)" bg="#E8F8F0" />
        <StatCard label="Failed" value={failed} icon="✕" color="var(--color-failed)" bg="#FDEDEC" />
        <StatCard label="Remaining" value={total - completed} icon="◐" color="var(--color-running)" bg="#EAF2FE" />
      </div>

      {/* Item list */}
      <div
        className="rounded-xl border overflow-hidden max-h-[420px] overflow-y-auto"
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
  icon,
  color,
  bg,
}: {
  label: string
  value: string | number
  icon: string
  color: string
  bg: string
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 transition-transform hover:-translate-y-0.5"
      style={{ background: bg, boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'white', color }}
        >
          {icon}
        </span>
      </div>
      <span className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}