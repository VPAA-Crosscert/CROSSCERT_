'use client'

import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 w-full lg:ml-64 min-w-0">
        <TopBar />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
