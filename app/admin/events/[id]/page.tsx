'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Users, Edit, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEventById } from '@/lib/event-context'
import { Event } from '@/lib/event-context'

export default function AdminEventDetail() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const foundEvent = getEventById(params.id as string)
    setEvent(foundEvent)
  }, [params.id])

  const handleDelete = () => {
    try {
      const existingNew = JSON.parse(localStorage.getItem('crosscert_local_events') || '[]')
      const filteredNew = existingNew.filter((e: Event) => String(e.id) !== String(params.id))
      localStorage.setItem('crosscert_local_events', JSON.stringify(filteredNew))
    } catch (err) {
      console.warn('Failed to update crosscert_local_events', err)
    }
    try {
      const existingOld = JSON.parse(localStorage.getItem('events') || '[]')
      const filteredOld = existingOld.filter((e: Event) => String(e.id) !== String(params.id))
      localStorage.setItem('events', JSON.stringify(filteredOld))
    } catch (err) {
      console.warn('Failed to update legacy events key', err)
    }
    router.push('/admin/events')
  }

  const handleEdit = () => {
    router.push(`/admin/events/${params.id}/edit`)
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    )
  }

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

      {/* Hero Section */}
      {(event.coverImage || event.cover_image) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={event.coverImage || event.cover_image || ''} 
          alt={event.name || event.title || 'Event cover'} 
          className="w-full aspect-video object-cover rounded-lg border border-border"
        />
      ) : (
        <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg border border-border" />
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{event.name || event.title || 'Untitled Event'}</h1>
            <p className="text-muted-foreground">{event.department || 'N/A'}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date & Time</span>
              </div>
              <p className="font-semibold text-foreground">{event.date || 'TBA'}</p>
              <p className="text-sm text-muted-foreground">
                {event.startTime || event.start_time || 'TBA'} - {event.endTime || event.end_time || 'TBA'}
              </p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="font-semibold text-foreground text-sm">{event.venue || event.location || 'TBA'}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Speaker</p>
              <p className="font-semibold text-foreground">{event.speakers}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <p className="font-semibold text-foreground">{event.status}</p>
            </Card>
          </div>

          {/* Description */}
          <Card className="p-6 border border-border bg-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card className="p-6 border border-border bg-card sticky top-20 space-y-4">
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gap-2"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
              Edit Event
            </Button>

            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Event
            </Button>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Event?</h2>
            <p className="text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
