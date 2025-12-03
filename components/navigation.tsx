'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Bell, Menu, X } from 'lucide-react'

export function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = resolvedTheme === 'dark' ? '/crosscert-typo-white.png' : '/crosscert-typo-black.png'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <button
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => router.push('/')}
            aria-label="CROSSCERT home"
          >
            {mounted && (
              <Image
                src={logoSrc}
                alt="CROSSCERT"
                width={160}
                height={40}
                priority
                className="w-28 sm:w-40 h-auto object-contain"
              />
            )}
          </button>

          <div className="hidden md:flex items-center gap-8 flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-9 w-9"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>

            {/* Mobile Menu */}
            <button
              className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-border mt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                router.push('/auth/signin')
                setIsOpen(false)
              }}
            >
              <Bell className="w-5 h-5" />
              Notifications
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
