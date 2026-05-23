export default function Loading() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="h-3 w-32 bg-card-hover rounded mb-3" />
            <div className="h-14 w-40 bg-card-hover rounded mb-2" />
            <div className="h-14 w-56 bg-primary/20 rounded" />
          </div>
          <div className="h-4 w-16 bg-card-hover rounded mb-2" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    </main>
  )
}
