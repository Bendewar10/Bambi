'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [email, setEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-muted-foreground">
        {email ? `Eingeloggt als ${email}` : 'Lädt...'}
      </p>
      <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline">
        {isLoggingOut ? 'Wird abgemeldet...' : 'Logout'}
      </Button>
    </div>
  )
}
