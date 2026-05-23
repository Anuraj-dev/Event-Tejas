'use client'
import { useState, useTransition } from 'react'
import Image from 'next/image'
import { castVotes } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import type { Logo, Vote } from '@/lib/types'

type RankedPick = { logo: Logo; rank: 1 | 2 | 3 }

const RANK_META = {
  1: { label: '1ST', pts: '3 pts', ring: 'border-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  2: { label: '2ND', pts: '2 pts', ring: 'border-slate-400', bg: 'bg-slate-400/10', text: 'text-slate-400' },
  3: { label: '3RD', pts: '1 pt',  ring: 'border-orange-600', bg: 'bg-orange-600/10', text: 'text-orange-500' },
} as const

export default function VotingUI({ logos, existingVotes }: { logos: Logo[], existingVotes: Vote[] }) {
  const [ranking, setRanking] = useState<RankedPick[]>(() =>
    existingVotes
      .map(v => {
        const logo = logos.find(l => l.id === v.logo_id)
        return logo ? { logo, rank: v.rank as 1 | 2 | 3 } : null
      })
      .filter((x): x is RankedPick => x !== null)
      .sort((a, b) => a.rank - b.rank)
  )

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const getRankOf = (id: string): (1 | 2 | 3) | null =>
    ranking.find(r => r.logo.id === id)?.rank ?? null

  const handleLogoClick = (logo: Logo) => {
    const existing = getRankOf(logo.id)
    if (existing !== null) {
      // Remove and re-number sequentially
      setRanking(
        ranking
          .filter(r => r.logo.id !== logo.id)
          .map((r, i) => ({ ...r, rank: (i + 1) as 1 | 2 | 3 }))
      )
      setSuccess(false)
    } else if (ranking.length < 3) {
      setRanking([...ranking, { logo, rank: (ranking.length + 1) as 1 | 2 | 3 }])
      setSuccess(false)
    }
  }

  const handleSubmit = () => {
    if (ranking.length === 0) { setError('Select at least one logo to vote.'); return }
    setError(null)
    startTransition(async () => {
      try {
        await castVotes(ranking.map(r => ({ logoId: r.logo.id, rank: r.rank })))
        setSuccess(true)
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-10">
      {/* Rank slots */}
      <section aria-label="Your current ranking">
        <h2 className="text-xs font-bold text-muted-light tracking-[0.25em] uppercase font-display mb-4">
          Your Ranking
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {([1, 2, 3] as const).map(rank => {
            const pick = ranking.find(r => r.rank === rank)
            const m = RANK_META[rank]
            return (
              <div
                key={rank}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                  pick ? `${m.ring} ${m.bg}` : 'border-border bg-card'
                }`}
              >
                <div className={`px-2.5 py-1.5 flex items-center gap-2 border-b ${pick ? 'border-current/20' : 'border-border'}`}>
                  <span className={`text-xs font-bold font-display tracking-wider ${pick ? m.text : 'text-muted'}`}>
                    {m.label}
                  </span>
                  <span className={`text-xs ${pick ? 'text-current/50' : 'text-muted/50'}`}>{m.pts}</span>
                </div>
                {pick ? (
                  <button
                    onClick={() => handleLogoClick(pick.logo)}
                    aria-label={`Remove ${m.label} pick`}
                    className="w-full aspect-square relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Image src={pick.logo.image_url} alt={`${m.label} ranked logo`} fill className="object-contain p-3" sizes="(max-width: 768px) 33vw, 340px" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold font-display tracking-widest">REMOVE</span>
                    </div>
                  </button>
                ) : (
                  <div className="aspect-square flex items-center justify-center" aria-label={`${m.label} slot empty`}>
                    <span className="text-border font-display font-bold text-4xl" aria-hidden>{rank}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Logo grid */}
      <section aria-label="All logos to vote on">
        <h2 className="text-xs font-bold text-muted-light tracking-[0.25em] uppercase font-display mb-4">
          Select Logos — click to rank, click again to remove
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {logos.map((logo, i) => {
            const rank = getRankOf(logo.id)
            const selected = rank !== null
            const disabled = !selected && ranking.length >= 3
            const m = rank ? RANK_META[rank] : null
            return (
              <button
                key={logo.id}
                onClick={() => handleLogoClick(logo)}
                disabled={disabled}
                aria-label={`Logo ${i + 1}${selected ? `, currently ranked ${rank}` : ''}`}
                aria-pressed={selected}
                className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected
                    ? `${m!.ring} ${m!.bg} scale-[0.97]`
                    : disabled
                    ? 'border-border bg-card opacity-35 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-card-hover'
                }`}
              >
                {selected && (
                  <div
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold font-display ${m!.ring} ${m!.bg} ${m!.text}`}
                    aria-hidden
                  >
                    {rank}
                  </div>
                )}
                <div className="aspect-square relative bg-card-hover">
                  <Image
                    src={logo.image_url}
                    alt={`Logo ${i + 1}`}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                </div>
                <div className="px-2.5 py-2 border-t border-border">
                  <span className="text-xs text-muted font-medium">Logo {i + 1}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Submit */}
      <div className="space-y-3 pb-4">
        {error && (
          <div role="alert" className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="text-cta text-sm bg-cta/10 border border-cta/20 rounded-lg px-4 py-3">
            Votes saved! You can change them any time before voting closes.
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending || ranking.length === 0}
          className="w-full py-4 bg-primary hover:bg-primary-dim text-white font-bold font-display text-lg tracking-widest rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed glow-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {isPending ? 'SUBMITTING…' : `SUBMIT ${ranking.length} / 3 VOTES`}
        </button>
      </div>
    </div>
  )
}
