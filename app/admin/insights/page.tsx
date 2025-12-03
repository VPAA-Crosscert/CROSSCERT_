'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, Users, CalendarCheck, Award } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdminInsights() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const eventsList = JSON.parse(localStorage.getItem('events') || '[]')
    setEvents(eventsList)
  }, [])

  const totalEvents = events.length
  const totalParticipants = events.reduce((sum, event) => sum + (event.participants?.length || 0), 0)
  const totalAttended = events.reduce((sum, event) => sum + (event.attended || 0), 0)
  const totalCertificates = events.reduce((sum, event) => sum + (event.certificates || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Insights & Analytics</h1>
        <p className="text-muted-foreground mt-1">View platform statistics and event analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Total Events</h3>
            <TrendingUp className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">All events created</p>
        </Card>

        <Card className="p-6 border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Total Participants</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalParticipants}</p>
          <p className="text-xs text-muted-foreground">Registered across all events</p>
        </Card>

        <Card className="p-6 border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Attended</h3>
            <CalendarCheck className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalAttended}</p>
          <p className="text-xs text-muted-foreground">Participants who attended</p>
        </Card>

        <Card className="p-6 border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Certificates</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalCertificates}</p>
          <p className="text-xs text-muted-foreground">Generated certificates</p>
        </Card>
      </div>
    </div>
  )
}
