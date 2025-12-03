'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Bell, User, Plus } from 'lucide-react'

export function TopBar() {
  const router = useRouter()
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-md items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              placeholder="Search events, participants..."
              className="pl-9 sm:pl-10 bg-background border-border text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto">
          <span className="hidden md:block text-xs sm:text-sm text-muted-foreground font-mono">{time}</span>
          <Button
            size="icon"
            variant="ghost"
            className="relative h-8 w-8 sm:h-9 sm:w-9"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></span>
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 md:px-4"
            onClick={() => router.push('/events/create')}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => router.push('/profile')}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
