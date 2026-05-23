import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import SubmitForm from './SubmitForm'
import type { Logo } from '@/lib/types'

export default async function SubmitPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const [{ data: settings }, { data: logos }] = await Promise.all([
    supabase.from('settings').select('voting_open').single(),
    supabase
      .from('logos')
      .select('id, author_id, image_url, label, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-secondary text-xs font-bold tracking-[0.3em] uppercase mb-3 font-display">
            Competition
          </p>
          <h1 className="text-[3.5rem] leading-none font-[800] text-text font-display">
            SUBMIT YOUR
          </h1>
          <h1 className="text-[3.5rem] leading-none font-[800] text-primary font-display mb-4">
            LOGOS
          </h1>
          <p className="text-muted text-base">
            Upload up to 2 logos. Your name stays hidden until voting closes.
          </p>
        </div>

        <SubmitForm
          existingLogos={(logos as Logo[]) ?? []}
          canSubmitMore={(logos?.length ?? 0) < 2}
          votingOpen={settings?.voting_open ?? true}
        />
      </div>
    </main>
  )
}
