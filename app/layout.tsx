import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Mazcify — Give Your Brand a Face',
  description: 'AI-powered brand mascot creator and video generator for your business.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
