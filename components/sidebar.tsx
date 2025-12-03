'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Calendar, Award, Users, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Events', icon: Calendar, href: '/events' },
  { label: 'Certificates', icon: Award, href: '/certificates' },
  { label: 'Participants', icon: Users, href: '/participants' },
  { label: 'Insights', icon: BarChart3, href: '/insights' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="fixed bottom-4 right-4 z-40 p-3 rounded-lg bg-primary text-primary-foreground shadow-lg lg:hidden hover:bg-primary/90 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 sm:w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-sidebar-border flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => {
          router.push('/')
          setIsOpen(false)
        }}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm sm:text-base">C</span>
          </div>
          <span className="font-bold text-sidebar-foreground text-sm sm:text-base">CROSSCERT</span>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-sidebar-border space-y-1 sm:space-y-2 bg-sidebar">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs sm:text-sm"
            onClick={() => {
              router.push('/profile')
              setIsOpen(false)
            }}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-destructive text-xs sm:text-sm"
            onClick={() => {
              // TODO: Handle logout
              router.push('/')
              setIsOpen(false)
            }}
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
