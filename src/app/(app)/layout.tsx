'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/contacts', label: 'Kontakte' },
  { href: '/analytics', label: 'Analytics' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <nav className="flex gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium text-muted-foreground hover:text-foreground',
                pathname === item.href && 'text-foreground underline'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {email ? `Eingeloggt als ${email}` : 'Lädt...'}
          </p>
          <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline">
            {isLoggingOut ? 'Wird abgemeldet...' : 'Logout'}
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}
