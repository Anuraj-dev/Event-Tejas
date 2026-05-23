import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions'
import Link from 'next/link'
import Image from 'next/image'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Member'
  const firstName = name.split(' ')[0]
  const avatar = user.user_metadata?.avatar_url as string | undefined

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3 border-b border-border"
      style={{ background: 'rgba(6,6,16,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <Link
        href="/submit"
        className="font-display text-lg font-bold tracking-[0.2em] text-secondary hover:text-text transition-colors"
      >
        TEAM TEJAS
      </Link>

      <div className="flex items-center gap-5 text-sm font-medium tracking-widest">
        <Link href="/submit" className="text-muted-light hover:text-text transition-colors uppercase">
          Submit
        </Link>
        <Link href="/vote" className="text-muted-light hover:text-text transition-colors uppercase">
          Vote
        </Link>
        <Link href="/results" className="text-muted-light hover:text-text transition-colors uppercase">
          Results
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {avatar && (
          <Image
            src={avatar}
            alt={`${firstName}'s avatar`}
            width={30}
            height={30}
            className="rounded-full ring-1 ring-border"
          />
        )}
        <span className="text-sm text-muted hidden sm:block">{firstName}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-muted hover:text-text transition-colors cursor-pointer uppercase tracking-wider"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
