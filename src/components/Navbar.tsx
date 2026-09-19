// src/components/Navbar.tsx
export function Navbar() {
  return (
    <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ background: 'var(--color-success)' }}
        />
        <h1 className="font-display text-lg font-bold tracking-tight">
          Async Job Queue
        </h1>
        <span
          className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
        >
          Live dashboard
        </span>
      </div>
    </header>
  )
}