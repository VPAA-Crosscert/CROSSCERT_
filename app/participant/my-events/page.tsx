'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MyEvents() {
  const router = useRouter()

  const upcomingEvents = [
    {
      id: 1,
      name: 'Python Workshop',
      date: 'Dec 15, 2024',
      time: '2:00 PM',
      location: 'CET Building',
      status: 'registered',
    },
    {
      id: 2,
      name: 'Leadership Seminar',
      date: 'Dec 18, 2024',
      time: '10:00 AM',
      location: 'Main Hall',
      status: 'registered',
    },
  ]

  const pastEvents = [
    {
      id: 3,
      name: 'Web Development Bootcamp',
      date: 'Dec 10, 2024',
      location: 'IT Lab',
      attended: true,
      evaluated: false,
    },
    {
      id: 4,
      name: 'Business Fundamentals',
      date: 'Dec 5, 2024',
      location: 'Business Center',
      attended: true,
      evaluated: true,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">My Events</h1>
        <p className="text-muted-foreground mt-1">Manage your registered and past events</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="p-4 border border-border bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{event.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date} • {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/participant/event/${event.id}/qrcode`)}
                  >
                    Show QR
                  </Button>
                  <Button
                    size="sm"
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    Check In
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Past Events */}
        <TabsContent value="past" className="space-y-4">
          {pastEvents.map((event) => (
            <Card key={event.id} className="p-4 border border-border bg-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{event.name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className={`w-4 h-4 ${event.attended ? 'text-green-500' : 'text-muted-foreground'}`} />
                      {event.attended ? 'Attended' : 'Not Attended'}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className={`w-4 h-4 ${event.evaluated ? 'text-green-500' : 'text-orange-500'}`} />
                      {event.evaluated ? 'Evaluated' : 'Pending Evaluation'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!event.evaluated && event.attended && (
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => router.push(`/participant/event/${event.id}/evaluate`)}
                    >
                      Evaluate
                    </Button>
                  )}
                  {event.evaluated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/participant/certificate/${event.id}`)}
                    >
                      View Certificate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
