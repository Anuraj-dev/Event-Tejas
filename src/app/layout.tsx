import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import './globals.css'

const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

export const metadata: Metadata = {
  title: 'Event Tejas — Logo Vote',
  description: 'Team Tejas logo redesign competition voting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {SUPABASE_ORIGIN && <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />}
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Nav />
        {children}
      </body>
    </html>
  )
}
