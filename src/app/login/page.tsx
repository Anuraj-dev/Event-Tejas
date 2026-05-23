import { getUser } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import LoginButton from './LoginButton'

export default async function LoginPage() {
  const user = await getUser()
  if (user) redirect('/submit')

  return (
    <main className="min-h-screen grid-bg flex items-center justify-center p-4">
      {/* Radial glow behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-secondary/20 bg-secondary/5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-cta pulse-dot"
              aria-hidden
            />
            <span className="text-secondary text-xs font-bold tracking-[0.3em] uppercase">
              Team Tejas
            </span>
          </div>

          <h1 className="text-[5rem] leading-none font-[800] text-text tracking-tight font-display">
            LOGO
          </h1>
          <h1 className="text-[5rem] leading-none font-[800] text-primary tracking-tight font-display mb-4">
            VOTE
          </h1>
          <p className="text-muted text-base">
            Cast your picks for the best redesign
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card border border-border rounded-2xl p-8 glow-primary">
          <LoginButton />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-card text-muted text-xs uppercase tracking-widest">
                members only
              </span>
            </div>
          </div>

          <p className="text-center text-muted text-sm">
            Only Team Tejas members can vote.
            <br />
            Sign in with your team Google account.
          </p>
        </div>

        <p className="text-center text-muted text-xs mt-6 tracking-widest uppercase">
          Voting closes Monday · 11:59 PM
        </p>
      </div>
    </main>
  )
}
