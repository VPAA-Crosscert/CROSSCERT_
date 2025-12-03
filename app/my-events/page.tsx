'use client'

import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, CheckCircle } from 'lucide-react'

const mockMyEvents = [
  {
    id: 1,
    title: 'Advanced Python Workshop',
    date: 'November 20, 2025',
    time: '2:00 PM - 5:00 PM',
    location: 'Tech Hub',
    status: 'attended',
    evaluationCompleted: true,
    certificateIssued: true,
  },
  {
    id: 2,
    title: 'Leadership Development Seminar',
    date: 'November 25, 2025',
    time: '9:00 AM - 12:00 PM',
    location: 'HCDC Conference Room',
    status: 'registered',
    evaluationCompleted: false,
    certificateIssued: false,
  },
  {
    id: 3,
    title: 'Web Development Bootcamp',
    date: 'December 1, 2025',
    time: '1:00 PM - 4:00 PM',
    location: 'Online',
    status: 'registered',
    evaluationCompleted: false,
    certificateIssued: false,
  },
]

export default function MyEventsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Events</h1>
              <p className="text-muted-foreground mt-2">Events you're registered for or have attended</p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => router.push('/discover')}
            >
              Browse Events
            </Button>
          </div>

          <div className="space-y-4">
            {mockMyEvents.map(event => (
              <Card
                key={event.id}
                className="p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                        <Badge className={`${
                          event.status === 'attended'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {event.status === 'attended' ? 'Attended' : 'Registered'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="border-t border-border pt-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`w-4 h-4 ${event.evaluationCompleted ? 'text-accent' : 'text-muted-foreground'}`} />
                        <span className={event.evaluationCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                          Evaluation {event.evaluationCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`w-4 h-4 ${event.certificateIssued ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={event.certificateIssued ? 'text-foreground' : 'text-muted-foreground'}>
                          Certificate {event.certificateIssued ? 'Issued' : 'Not Issued'}
                        </span>
                      </div>

                      <div className="ml-auto flex gap-2">
                        {event.status === 'attended' && !event.evaluationCompleted && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => router.push(`/event/${event.id}/evaluation`)}
                          >
                            Complete Evaluation
                          </Button>
                        )}
                        {event.certificateIssued && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/my-certificates')}
                          >
                            View Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {mockMyEvents.length === 0 && (
            <Card className="p-12 text-center border border-dashed border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">You haven't registered for any events yet</p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push('/discover')}
              >
                Browse Events
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
