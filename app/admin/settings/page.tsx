'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell, Lock, Users } from 'lucide-react'

export default function AdminSettings() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Configure platform settings</p>
      </div>

      {/* Notification Settings */}
      <Card className="p-6 border border-border bg-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Configure how you receive notifications about event registrations and check-ins.</p>
        <Button variant="outline" className="w-full justify-start text-foreground border-border">
          Email Notifications
        </Button>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 border border-border bg-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
        </div>
        <Button variant="outline" className="w-full justify-start text-foreground border-border mb-2">
          Change Password
        </Button>
        <Button variant="outline" className="w-full justify-start text-foreground border-border">
          Two-Factor Authentication
        </Button>
      </Card>

      {/* User Management */}
      <Card className="p-6 border border-border bg-card space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage admin accounts and permissions.</p>
        <Button variant="outline" className="w-full justify-start text-foreground border-border">
          View Admin Accounts
        </Button>
      </Card>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      >
        Logout
      </Button>
    </div>
  )
}
