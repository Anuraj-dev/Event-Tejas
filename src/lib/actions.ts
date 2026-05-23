'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function deleteLogo(logoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: logo } = await supabase
    .from('logos')
    .select('image_url, author_id')
    .eq('id', logoId)
    .single()

  if (!logo || logo.author_id !== user.id) throw new Error('Not authorized')

  // Remove from storage
  try {
    const url = new URL(logo.image_url)
    const storagePath = url.pathname.split('/logos/')[1]
    if (storagePath) {
      await supabase.storage.from('logos').remove([storagePath])
    }
  } catch {
    // Continue even if storage delete fails
  }

  await supabase.from('logos').delete().eq('id', logoId)
  revalidatePath('/submit')
}

export async function castVotes(picks: { logoId: string; rank: 1 | 2 | 3 }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: settings } = await supabase
    .from('settings')
    .select('voting_open')
    .single()

  if (!settings?.voting_open) throw new Error('Voting is currently closed')
  if (picks.length === 0) throw new Error('Select at least one logo')
  if (picks.length > 3) throw new Error('Maximum 3 picks allowed')

  // Verify none belong to the current user (defence-in-depth; RLS also enforces)
  const logoIds = picks.map(p => p.logoId)
  const { data: ownLogos } = await supabase
    .from('logos')
    .select('id')
    .in('id', logoIds)
    .eq('author_id', user.id)

  if (ownLogos && ownLogos.length > 0) throw new Error('Cannot vote for your own logos')

  // Replace all existing votes atomically
  await supabase.from('votes').delete().eq('voter_id', user.id)

  const { error } = await supabase.from('votes').insert(
    picks.map(p => ({ voter_id: user.id, logo_id: p.logoId, rank: p.rank }))
  )
  if (error) throw error

  revalidatePath('/vote')
  revalidatePath('/results')
}
