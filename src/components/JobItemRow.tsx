// src/components/JobItemRow.tsx
'use client'

import type { JobItemDTO } from '@/types'

interface JobItemRowProps {
  item: JobItemDTO
  onRetry: (itemId: string) => void
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  pending: { color: 'var(--color-pending)', bg: '#FEF6E7', icon: '○', label: 'Pending' },
  running: { color: 'var(--color-running)', bg: '#EAF2FE', icon: '◐', label: 'Running' },
  success: { color: 'var(--color-success)', bg: '#E8F8F0', icon: '✓', label: 'Success' },
  failed: { color: 'var(--color-failed)', bg: '#FDEDEC', icon: '✕', label: 'Failed' },
}

export function JobItemRow({ item, onRetry }: JobItemRowProps) {
  const config = STATUS_CONFIG[item.status]

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 border-b last:border-b-0 transition-colors hover:bg-gray-50"
      style={{
        borderLeft: `3px solid ${config.color}`,
        borderColor: 'var(--color-border)',
      }}
    >
      <span className="text-xs font-medium w-10" style={{ color: 'var(--color-text-muted)' }}>
        #{item.index}
      </span>

      <span
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-24 justify-center"
        style={{ background: config.bg, color: config.color }}
      >
        <span>{config.icon}</span>
        {config.label}
      </span>

      <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
        {item.error ?? ''}
      </span>

      <span className="text-xs w-24 text-right" style={{ color: 'var(--color-text-muted)' }}>
        {item.attempts > 0 ? `${item.attempts} attempt(s)` : ''}
      </span>

      {item.status === 'failed' && (
        <button
          onClick={() => onRetry(item.id)}
          className="text-xs font-medium text-white rounded-lg px-3 py-1.5 transition-transform hover:-translate-y-0.5"
          style={{ background: 'var(--color-brand)' }}
        >
          Retry
        </button>
      )}
    </div>
  )
}