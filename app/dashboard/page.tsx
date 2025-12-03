'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, Calendar, Award, CheckCircle, AlertCircle } from 'lucide-react'

const statCards = [
  { label: 'Total Events', value: '12', icon: Calendar, color: 'primary' },
  { label: 'Certificates Issued', value: '342', icon: Award, color: 'accent' },
  { label: 'Attendance Today', value: '87', icon: CheckCircle, color: 'primary' },
  { label: 'Pending Evaluations', value: '23', icon: AlertCircle, color: 'accent' },
]

const upcomingEvents = [
  { id: 1, name: 'Python Workshop', date: 'Nov 20, 2025', participants: 45, status: 'scheduled' },
  { id: 2, name: 'Leadership Seminar', date: 'Nov 25, 2025', participants: 120, status: 'scheduled' },
  { id: 3, name: 'Web Dev Bootcamp', date: 'Dec 1, 2025', participants: 78, status: 'draft' },
]

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome back! Here's your event overview.</p>
        </div>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto text-sm sm:text-base"
          onClick={() => router.push('/events/create')}
        >
          <Calendar className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="p-4 sm:p-5 md:p-6 border border-border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${stat.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color === 'primary' ? 'text-primary' : 'text-accent'}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">12% from last month</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card className="border border-border bg-card p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Upcoming Events</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
                onClick={() => router.push('/events')}
              >
                View all
              </Button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">{event.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-foreground">{event.participants}</p>
                      <p className="text-xs text-muted-foreground">participants</p>
                    </div>
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      event.status === 'scheduled'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {event.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="border border-border bg-card p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => router.push('/events/create')}
              >
                Create Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => router.push('/events')}
              >
                View All Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => router.push('/participants')}
              >
                Manage Participants
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs sm:text-sm"
                onClick={() => router.push('/certificates')}
              >
                View Certificates
              </Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="border border-border bg-card p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Recent Activity</h2>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium text-foreground text-xs sm:text-sm">Event Created</p>
                <p className="text-xs text-muted-foreground mt-0.5">Python Workshop scheduled for Nov 20</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-accent/5 border border-accent/20">
                <p className="font-medium text-foreground text-xs sm:text-sm">23 Evaluations Pending</p>
                <p className="text-xs text-muted-foreground mt-0.5">Complete evaluations for certificate generation</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-muted">
                <p className="font-medium text-foreground text-xs sm:text-sm">87 Check-ins Today</p>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time attendance tracking active</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
