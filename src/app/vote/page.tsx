import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import VotingUI from './VotingUI'
import type { Logo, Vote, Settings } from '@/lib/types'

export default async function VotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, { data: logos }, { data: myVotes }] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase
      .from('logos')
      .select('id, author_id, image_url, label, created_at')
      .neq('author_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('votes')
      .select('id, voter_id, logo_id, rank, created_at')
      .eq('voter_id', user.id),
  ])

  const s = settings as Settings | null
  const votingOpen = s?.voting_open ?? true

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <p className="text-secondary text-xs font-bold tracking-[0.3em] uppercase mb-3 font-display">
                Competition
              </p>
              <h1 className="text-[3.5rem] leading-none font-[800] text-text font-display">
                CAST YOUR
              </h1>
              <h1 className="text-[3.5rem] leading-none font-[800] text-primary font-display mb-4">
                VOTES
              </h1>
              <p className="text-muted text-base">
                Pick your top 3 in order · 1st = 3 pts · 2nd = 2 pts · 3rd = 1 pt
              </p>
            </div>
          </div>

          {!votingOpen ? (
            <div className="text-center py-20 text-muted border border-border rounded-2xl bg-card">
              <p className="text-3xl font-display font-bold mb-3">VOTING IS CLOSED</p>
              <Link href="/results" className="text-secondary hover:underline">
                See the final results →
              </Link>
            </div>
          ) : !logos?.length ? (
            <div className="text-center py-20 text-muted border border-border rounded-2xl bg-card">
              <p className="text-3xl font-display font-bold mb-3">NO LOGOS YET</p>
              <p className="text-sm">Check back when other members have submitted their designs.</p>
            </div>
          ) : (
            <VotingUI
              logos={logos as Logo[]}
              existingVotes={(myVotes as Vote[]) ?? []}
            />
          )}
        </div>
      </main>
    </>
  )
}
