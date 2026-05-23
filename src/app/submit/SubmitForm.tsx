'use client'
import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteLogo } from '@/lib/actions'
import { useRouter } from 'next/navigation'
import type { Logo } from '@/lib/types'

const ACCEPTED = 'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp'

export default function SubmitForm({
  existingLogos,
  canSubmitMore,
  votingOpen,
}: {
  existingLogos: Logo[]
  canSubmitMore: boolean
  votingOpen: boolean
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ACCEPTED.split(',').includes(f.type)) {
      setError('Accepted formats: PNG, JPG, SVG, WebP')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB')
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f) return
    const fakeEvent = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(fakeEvent)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const ext = file.name.split('.').pop() ?? 'png'
      const filename = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('logos')
        .upload(filename, file, { cacheControl: '3600', upsert: false })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(filename)

      const { error: dbErr } = await supabase.from('logos').insert({
        author_id: user.id,
        image_url: publicUrl,
        label: `logo-${Date.now()}`,
      })
      if (dbErr) throw dbErr

      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    } catch (err: unknown) {
      const props = err && typeof err === 'object' ? Object.getOwnPropertyNames(err) : []
      console.error('[upload] raw:', err)
      console.error('[upload] props:', JSON.stringify(err, props, 2))
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err, props)
      setError(msg || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (logoId: string) => {
    startTransition(async () => {
      try {
        await deleteLogo(logoId)
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Delete failed.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Existing submissions */}
      {existingLogos.length > 0 && (
        <section aria-label="Your submitted logos">
          <h2 className="text-xs font-bold text-muted-light tracking-[0.25em] uppercase font-display mb-4">
            Your Submissions ({existingLogos.length}/2)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {existingLogos.map((logo, i) => (
              <article
                key={logo.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="aspect-square relative bg-card-hover">
                  <Image
                    src={logo.image_url}
                    alt={`Your logo submission ${i + 1}`}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-3 flex items-center justify-between border-t border-border">
                  <span className="text-muted text-sm">Logo {i + 1}</span>
                  <button
                    onClick={() => handleDelete(logo.id)}
                    disabled={isPending}
                    aria-label={`Delete logo ${i + 1}`}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-end"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Upload zone */}
      {canSubmitMore && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-xl transition-colors hover:border-primary/40 focus-within:border-primary/40"
        >
          {!preview ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              aria-label="Upload logo file"
              className="flex flex-col items-center gap-4 p-10 cursor-pointer focus:outline-none"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden>
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-text font-semibold">Drop your logo here</p>
                <p className="text-muted text-sm mt-1">PNG, JPG, SVG, WebP · Max 10MB</p>
              </div>
              <span className="px-5 py-2 bg-primary/10 border border-primary/30 text-secondary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                Choose File
              </span>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div className="relative h-56 rounded-lg overflow-hidden bg-card-hover">
                <Image src={preview} alt="Logo preview" fill className="object-contain p-4" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3.5 bg-cta hover:bg-cta-dim text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-display tracking-widest text-sm glow-cta"
                >
                  {uploading ? 'UPLOADING…' : 'SUBMIT LOGO'}
                </button>
                <button
                  onClick={() => { setPreview(null); setFile(null) }}
                  aria-label="Cancel upload"
                  className="px-5 py-3.5 bg-card border border-border text-muted hover:text-text rounded-xl transition-colors cursor-pointer min-w-[48px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload logo"
          />
        </div>
      )}

      {existingLogos.length >= 2 && (
        <div className="text-center py-8 text-muted border border-border rounded-xl bg-card">
          <p className="font-medium">You have submitted the maximum of 2 logos.</p>
          {votingOpen && (
            <p className="text-sm mt-2">
              Ready to vote?{' '}
              <Link href="/vote" className="text-secondary hover:underline focus:outline-none focus:underline">
                Go to voting →
              </Link>
            </p>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
    </div>
  )
}
