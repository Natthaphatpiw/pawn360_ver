import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pawn360 - Future of Valuables & Loans',
  description: 'Empowering Pawn Shops, Connecting Pawners to Investors, and Offering Secure Asset-Backed Opportunities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}