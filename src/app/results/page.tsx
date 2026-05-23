import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import LiveResults from './LiveResults'
import type { Logo, Settings, ScoredEntry } from '@/lib/types'

export default async function ResultsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [{ data: settings }, { data: logos }, { data: votes }, { data: profiles }] =
    await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('logos').select('id, author_id, image_url, label, created_at').order('created_at'),
      supabase.from('votes').select('logo_id, rank'),
      supabase.from('profiles').select('id, full_name, avatar_url'),
    ])

  const s = settings as Settings | null
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Attach profiles to logos
  const logosWithProfiles = (logos ?? []).map((l, i) => ({
    ...l,
    displayNum: i + 1,
    profiles: profileMap.get(l.author_id) ?? null,
  })) as (Logo & { displayNum: number })[]

  // Calculate Borda scores
  const scoreMap = new Map<string, number>()
  const countMap = new Map<string, { r1: number; r2: number; r3: number }>()

  for (const v of votes ?? []) {
    const pts = v.rank === 1 ? 3 : v.rank === 2 ? 2 : 1
    scoreMap.set(v.logo_id, (scoreMap.get(v.logo_id) ?? 0) + pts)
    const c = countMap.get(v.logo_id) ?? { r1: 0, r2: 0, r3: 0 }
    if (v.rank === 1) c.r1++
    else if (v.rank === 2) c.r2++
    else c.r3++
    countMap.set(v.logo_id, c)
  }

  const scored: ScoredEntry[] = logosWithProfiles
    .map(logo => ({
      logo,
      score: scoreMap.get(logo.id) ?? 0,
      counts: countMap.get(logo.id) ?? { r1: 0, r2: 0, r3: 0 },
    }))
    .sort((a, b) => b.score - a.score)

  const maxScore = Math.max(...scored.map(s => s.score), 1)

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-secondary text-xs font-bold tracking-[0.3em] uppercase mb-3 font-display">
              Competition
            </p>
            <h1 className="text-[3.5rem] leading-none font-[800] text-text font-display">LIVE</h1>
            <h1 className="text-[3.5rem] leading-none font-[800] text-primary font-display">RESULTS</h1>
          </div>
          <div className="flex items-center gap-2 mb-2" aria-label="Live updating">
            <span className="w-2 h-2 rounded-full bg-cta pulse-dot" aria-hidden />
            <span className="text-cta text-sm font-medium tracking-widest font-display">LIVE</span>
          </div>
        </div>

        <LiveResults
          initialScored={scored}
          initialMaxScore={maxScore}
          revealAuthors={s?.reveal_authors ?? false}
          allLogos={logosWithProfiles}
        />
      </div>
    </main>
  )
}
