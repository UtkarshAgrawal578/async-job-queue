// src/components/JobHistory.tsx
'use client'

import { useEffect, useState } from 'react'
import type { JobDTO } from '@/types'

interface JobHistoryProps {
  onSelectJob: (jobId: string) => void
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending: { color: 'var(--color-pending)', bg: '#FEF6E7' },
  running: { color: 'var(--color-running)', bg: '#EAF2FE' },
  completed: { color: 'var(--color-success)', bg: '#E8F8F0' },
}

export function JobHistory({ onSelectJob }: JobHistoryProps) {
  const [jobs, setJobs] = useState<JobDTO[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function fetchJobs() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error('Failed to load jobs')
      const data: JobDTO[] = await res.json()
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next) fetchJobs()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleToggle}
        className="text-sm font-semibold rounded-xl px-6 py-2.5 text-white transition-transform hover:-translate-y-0.5"
        style={{
          background: isOpen
            ? 'var(--color-text-muted)'
            : 'linear-gradient(135deg, var(--color-success), #0E9F5F)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isOpen ? 'Hide all jobs' : 'View all jobs'}
      </button>

      {isOpen && (
        <div
          className="rounded-xl border overflow-hidden w-full"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isLoading && (
            <p className="p-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Loading jobs...
            </p>
          )}

          {error && (
            <p className="p-4 text-sm" style={{ color: 'var(--color-failed)' }}>
              {error}
            </p>
          )}

          {!isLoading && !error && jobs?.length === 0 && (
            <p className="p-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No jobs submitted yet.
            </p>
          )}

          {!isLoading &&
            jobs?.map((job) => {
              const succeeded = job.items.filter((i) => i.status === 'success').length
              const failed = job.items.filter((i) => i.status === 'failed').length
              const statusStyle = STATUS_COLORS[job.status] ?? STATUS_COLORS.pending

              return (
                <button
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className="w-full flex items-center gap-3 py-3 px-4 border-b last:border-b-0 text-left hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-24 text-center"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {job.status}
                  </span>

                  <span className="text-sm font-medium">{job.count} items</span>

                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    ✓ {succeeded} &nbsp; ✕ {failed}
                  </span>

                  <span
                    className="ml-auto text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}