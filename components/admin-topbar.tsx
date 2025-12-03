'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminTopbar() {
  const router = useRouter()

  return (
    <div className="h-14 sm:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 sm:px-4 md:px-6">
      <div className="flex-1 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">Admin Dashboard</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  )
}
