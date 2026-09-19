// src/components/BatchForm.tsx
'use client'

import { useState } from 'react'

interface BatchFormProps {
  onJobCreated: (jobId: string) => void
}

export function BatchForm({ onJobCreated }: BatchFormProps) {
  const [count, setCount] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to create job')
      }

      const job = await res.json()
      onJobCreated(job.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <label className="flex flex-col gap-1.5 items-center">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          NUMBER OF ITEMS
        </span>
        <input
          type="number"
          min={1}
          max={500}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="border rounded-xl px-4 py-2.5 w-40 text-center outline-none transition-shadow focus:shadow-md bg-white"
          style={{ borderColor: 'var(--color-border)' }}
          required
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl px-6 py-2.5 font-medium text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        style={{
          background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Batch'}
      </button>

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-failed)' }}>
          {error}
        </p>
      )}
    </form>
  )
}