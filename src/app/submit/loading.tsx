export default function Loading() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="mb-10">
          <div className="h-3 w-32 bg-card-hover rounded mb-3" />
          <div className="h-14 w-72 bg-card-hover rounded mb-2" />
          <div className="h-14 w-48 bg-primary/20 rounded mb-4" />
          <div className="h-4 w-96 bg-card-hover rounded" />
        </div>
        <div className="h-72 border border-dashed border-border rounded-2xl bg-card" />
      </div>
    </main>
  )
}
