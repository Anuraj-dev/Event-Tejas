'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Logo, ScoredEntry } from '@/lib/types'

const PLACE_STYLES = [
  { border: 'border-amber-400', bg: 'bg-amber-400/5', bar: 'bg-amber-400', label: 'text-amber-400' },
  { border: 'border-slate-400', bg: 'bg-slate-400/5', bar: 'bg-slate-300', label: 'text-slate-400' },
  { border: 'border-orange-600', bg: 'bg-orange-600/5', bar: 'bg-orange-600', label: 'text-orange-500' },
]

const PlaceIcon = ({ index }: { index: number }) => {
  if (index === 0) return (
    <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  )
  if (index === 1) return (
    <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  )
  if (index === 2) return (
    <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  )
  return <span className="text-muted font-bold font-display text-lg w-6 text-center">#{index + 1}</span>
}

export default function LiveResults({
  initialScored,
  initialMaxScore,
  revealAuthors,
  allLogos,
}: {
  initialScored: ScoredEntry[]
  initialMaxScore: number
  revealAuthors: boolean
  allLogos: (Logo & { displayNum: number })[]
}) {
  const [scored, setScored] = useState(initialScored)
  const [maxScore, setMaxScore] = useState(initialMaxScore)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('results-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, async () => {
        const { data: votes } = await supabase.from('votes').select('logo_id, rank')

        const sMap = new Map<string, number>()
        const cMap = new Map<string, { r1: number; r2: number; r3: number }>()

        for (const v of votes ?? []) {
          const pts = v.rank === 1 ? 3 : v.rank === 2 ? 2 : 1
          sMap.set(v.logo_id, (sMap.get(v.logo_id) ?? 0) + pts)
          const c = cMap.get(v.logo_id) ?? { r1: 0, r2: 0, r3: 0 }
          if (v.rank === 1) c.r1++
          else if (v.rank === 2) c.r2++
          else c.r3++
          cMap.set(v.logo_id, c)
        }

        const next: ScoredEntry[] = allLogos
          .map(logo => ({
            logo,
            score: sMap.get(logo.id) ?? 0,
            counts: cMap.get(logo.id) ?? { r1: 0, r2: 0, r3: 0 },
          }))
          .sort((a, b) => b.score - a.score)

        setScored(next)
        setMaxScore(Math.max(...next.map(e => e.score), 1))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [allLogos])

  if (scored.length === 0) {
    return (
      <div className="text-center py-20 text-muted border border-border rounded-2xl bg-card">
        <p className="text-3xl font-display font-bold mb-3">NO RESULTS YET</p>
        <p className="text-sm">Results appear as members submit and vote on logos.</p>
      </div>
    )
  }

  return (
    <ol className="space-y-3" aria-label="Leaderboard">
      {scored.map((entry, i) => {
        const style = i < 3 ? PLACE_STYLES[i] : null
        const barPct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0
        return (
          <li
            key={entry.logo.id}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 fade-in ${
              style
                ? `${style.border} ${style.bg}`
                : 'border-border bg-card'
            }`}
          >
            {/* Position */}
            <div className="w-8 flex items-center justify-center flex-shrink-0">
              <PlaceIcon index={i} />
            </div>

            {/* Logo thumbnail */}
            <div className="w-14 h-14 relative flex-shrink-0 rounded-lg overflow-hidden border border-border bg-card-hover">
              <Image
                src={entry.logo.image_url}
                alt={`Logo ${entry.logo.displayNum} thumbnail`}
                fill
                className="object-contain p-1"
                sizes="56px"
                priority={i < 3}
              />
            </div>

            {/* Info + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-2">
                <div className="min-w-0">
                  <span className={`font-display font-bold tracking-wide ${style ? style.label : 'text-text'}`}>
                    LOGO {entry.logo.displayNum}
                  </span>
                  {revealAuthors && entry.logo.profiles?.full_name && (
                    <span className="text-muted text-sm ml-2 truncate">
                      by {entry.logo.profiles.full_name}
                    </span>
                  )}
                </div>
                <span className={`font-display font-bold text-lg ml-4 flex-shrink-0 ${style ? style.label : 'text-secondary'}`}>
                  {entry.score} <span className="text-sm font-normal">pts</span>
                </span>
              </div>

              {/* Score bar */}
              <div className="h-1.5 bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={entry.score} aria-valuemax={maxScore} aria-label={`Score: ${entry.score} points`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${style ? style.bar : 'bg-primary'}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* Vote breakdown */}
              {entry.score > 0 && (
                <div className="flex gap-3 mt-1.5" aria-label="Vote breakdown">
                  {entry.counts.r1 > 0 && (
                    <span className="text-xs text-amber-400">{entry.counts.r1}×1st</span>
                  )}
                  {entry.counts.r2 > 0 && (
                    <span className="text-xs text-slate-400">{entry.counts.r2}×2nd</span>
                  )}
                  {entry.counts.r3 > 0 && (
                    <span className="text-xs text-orange-500">{entry.counts.r3}×3rd</span>
                  )}
                </div>
              )}
              {entry.score === 0 && (
                <p className="text-xs text-muted mt-1">No votes yet</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
