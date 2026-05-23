import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Event Tejas — Logo Vote',
  description: 'Team Tejas logo redesign competition voting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  )
}
