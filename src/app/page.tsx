// src/app/page.tsx
'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BatchForm } from '@/components/BatchForm'
import { JobDashboard } from '@/components/JobDashboard'

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
        <div>
          <h2 className="font-display text-2xl font-bold mb-1">Submit a batch</h2>
          <p style={{ color: 'var(--color-text-muted)' }} className="text-sm mb-5">
            Each item is processed asynchronously and updates live below.
          </p>
          <BatchForm onJobCreated={setActiveJobId} />
        </div>

        {activeJobId && <JobDashboard jobId={activeJobId} />}
      </main>
    </div>
  )
}