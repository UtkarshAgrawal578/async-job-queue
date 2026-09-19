// src/app/page.tsx
'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BatchForm } from '@/components/BatchForm'
import { JobDashboard } from '@/components/JobDashboard'
import { JobHistory } from '@/components/JobHistory'

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#F4F5FA' }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-12">
        <section
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, #EEEBFF 0%, #F6F4FF 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2
            className="font-display text-2xl font-bold mb-1 text-center"
            style={{ color: 'var(--color-brand)' }}
          >
            Submit a batch
          </h2>
          <p
            style={{ color: 'var(--color-text-muted)' }}
            className="text-sm mb-6 text-center"
          >
            Each item is processed asynchronously in the background — no page refresh needed.
          </p>
          <BatchForm onJobCreated={setActiveJobId} />
        </section>

        {activeJobId && (
          <section
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg, #E7F0FF 0%, #F3F8FF 100%)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2
              className="font-display text-2xl font-bold mb-6 text-center"
              style={{ color: 'var(--color-running)' }}
            >
              Live progress
            </h2>
            <JobDashboard jobId={activeJobId} />
          </section>
        )}

        <section
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, #E9FBF1 0%, #F3FDF7 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2
            className="font-display text-2xl font-bold mb-6 text-center"
            style={{ color: 'var(--color-success)' }}
          >
            Job history
          </h2>
          <JobHistory onSelectJob={setActiveJobId} />
        </section>
      </main>
    </div>
  )
}