// src/components/Navbar.tsx
export function Navbar() {
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur bg-white/80"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
          }}
        >
          Q
        </div>
        <h1 className="font-display text-lg font-bold tracking-tight">
          Async Job Queue
        </h1>

        <span
          className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--color-success)' }}
          />
          Live
        </span>
      </div>
    </header>
  )
}