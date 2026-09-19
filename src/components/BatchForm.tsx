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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-lg">
      <label className="flex-1 flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Batch Item Count
        </span>
        <input
          type="number"
          min={1}
          max={500}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          required
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl px-6 py-3 font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 min-w-[140px]"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Submitting</span>
          </>
        ) : (
          <span>Submit Batch →</span>
        )}
      </button>

      {error && (
        <p className="text-xs font-medium text-red-400 sm:col-span-2 mt-1">
          {error}
        </p>
      )}
    </form>
  )
}