'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ParticipantSidebar } from '@/components/participant-sidebar'
import { ParticipantTopbar } from '@/components/participant-topbar'

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'participant') {
      router.push('/auth/signin')
    }
  }, [router])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ParticipantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 w-full min-w-0">
        <ParticipantTopbar />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
