import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Claim Command Pro - Insurance Claim Intelligence Platform',
  description: 'Professional insurance claim documentation and analysis tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <div id="app-root" className="min-h-screen w-full max-w-none mx-0 box-border">
          {children}
        </div>
      </body>
    </html>
  )
}
