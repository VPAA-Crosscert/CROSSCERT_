'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Bookmark, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredEvents } from '@/lib/event-context'
import { Event } from '@/lib/event-context'

export default function BookmarksPage() {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState<Set<number | string>>(new Set())
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const storedEvents = getStoredEvents()
    setEvents(storedEvents)
    
    // Load bookmarked events from localStorage
    const storedBookmarks = localStorage.getItem('bookmarkedEvents')
    if (storedBookmarks) {
      setBookmarked(new Set(JSON.parse(storedBookmarks)))
    }
  }, [])

  const toggleBookmark = (id: string | number) => {
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(id)) {
      newBookmarked.delete(id)
    } else {
      newBookmarked.add(id)
    }
    setBookmarked(newBookmarked)
    localStorage.setItem('bookmarkedEvents', JSON.stringify(Array.from(newBookmarked)))
  }

  // Filter events to show only bookmarked ones
  const bookmarkedEvents = events.filter((event) => {
    const eventName = (event.name || event.title || '').toString()
    return bookmarked.has(event.id) && eventName
  })

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
        <h1 className="text-3xl font-bold text-foreground">Bookmarked Events</h1>
        <p className="text-muted-foreground mt-1">Your saved events</p>
      </div>

      {/* Bookmarked Events Grid */}
      {bookmarkedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarkedEvents.map((event) => {
            const eventName = event.name || event.title || 'Untitled Event'
            return (
              <Card
                key={event.id}
                className="overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20" />

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground line-clamp-2">{eventName}</h3>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date} • {event.startTime || event.start_time || 'TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.venue || event.location || 'TBA'}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      onClick={() => router.push(`/participant/event/${event.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBookmark(event.id)}
                    >
                      <Bookmark className="w-5 h-5 fill-primary text-primary" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 border border-border bg-card text-center">
          <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Bookmarked Events</h3>
          <p className="text-muted-foreground mb-6">
            Start bookmarking events to save them for later
          </p>
          <Button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={() => router.push('/participant/events')}
          >
            Discover Events
          </Button>
        </Card>
      )}
    </div>
  )
}

