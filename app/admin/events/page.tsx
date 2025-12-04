'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react'
import { adminApi, apiCall } from '@/lib/api-config'

type AdminEvent = {
  id: number | string
  title?: string
  name?: string
  date?: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  location?: string
  venue?: string
  cover_image?: string
  coverImage?: string
}

export default function AdminEvents() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | string | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch from API first (prioritize backend data)
        const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
        console.log('[Events List] Fetching events from:', eventsUrl)
        const res = await apiCall.get(eventsUrl)
        
        console.log('[Events List] Response status:', res.status, res.statusText)
        
        if (!res.ok) {
          console.error('[Events List] Unable to load events. Status:', res.status, res.statusText)
          // Fallback to localStorage if API fails
          const existing = localStorage.getItem('crosscert_local_events')
          if (existing) {
            const list = JSON.parse(existing) as AdminEvent[]
            console.log('[Events List] Using localStorage fallback, events count:', list.length)
            setEvents(Array.isArray(list) ? list : [])
          } else {
            console.log('[Events List] No localStorage fallback available')
            setEvents([])
          }
          return
        }
        
        let data: unknown = []
        try {
          data = await res.json()
          console.log('[Events List] Raw API response:', data)
        } catch {
          console.error('[Events List] Events API did not return JSON. Check NEXT_PUBLIC_API_URL and Django server.')
          setEvents([])
          return
        }
        
        // Handle paginated response from Django REST Framework
        // It might return {results: [...]} or a direct array
        let eventsList: AdminEvent[] = []
        if (Array.isArray(data)) {
          eventsList = data as AdminEvent[]
          console.log('[Events List] Direct array response, events count:', eventsList.length)
        } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
          eventsList = data.results as AdminEvent[]
          console.log('[Events List] Paginated response (results), events count:', eventsList.length)
        } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          eventsList = data.data as AdminEvent[]
          console.log('[Events List] Paginated response (data), events count:', eventsList.length)
        } else {
          console.warn('[Events List] Unknown response format:', data)
        }
        
        console.log('[Events List] Final events list:', eventsList)
        console.log('[Events List] Event IDs:', eventsList.map(e => ({ id: e.id, type: typeof e.id, title: e.title || e.name })))
        setEvents(eventsList)
      } catch (err) {
        console.error('Error fetching events:', err)
        // Fallback to localStorage on error
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as AdminEvent[]
            setEvents(Array.isArray(list) ? list : [])
          } catch {
            setEvents([])
          }
        } else {
          setEvents([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const eventName = (event.title || event.name || '').toString()
    return eventName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleDelete = async (id: number | string) => {
    console.log('[Delete Event] Deleting event with ID:', id)
    setShowDeleteConfirm(null)
    
    try {
      // Delete from API
      const eventUrl = adminApi.eventById(id)
      console.log('[Delete Event] Deleting from API:', eventUrl)
      
      const response = await apiCall.delete(eventUrl)
      console.log('[Delete Event] Delete response status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('[Delete Event] Failed to delete from API:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[Delete Event] Error details:', errorText)
        alert(`Failed to delete event: ${response.status} ${response.statusText}`)
        return
      }
      
      console.log('[Delete Event] ✅ Successfully deleted from API')
      
      // Update local state by removing the deleted event
      const remaining = events.filter(e => String(e.id) !== String(id))
      setEvents(remaining)
      console.log('[Delete Event] Updated local state, remaining events:', remaining.length)
      
      // Optionally try to clean up localStorage (but don't fail if it's full)
      try {
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          const list = JSON.parse(existing) as AdminEvent[]
          const filtered = list.filter(e => String(e.id) !== String(id))
          localStorage.setItem('crosscert_local_events', JSON.stringify(filtered))
          console.log('[Delete Event] Cleaned up localStorage')
        }
      } catch (lsErr) {
        // Ignore localStorage errors (it might be full, that's okay)
        console.warn('[Delete Event] Could not update localStorage (quota may be exceeded):', lsErr)
      }
    } catch (err: any) {
      console.error('[Delete Event] Error during delete:', err)
      alert(`Failed to delete event: ${err.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Events</h1>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          onClick={() => router.push('/admin/events/create')}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search events..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md bg-background border-border"
      />

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <Card className="p-6 border border-border text-center col-span-full">
            Loading events...
          </Card>
        )}
        {!loading && filteredEvents.map((event) => (
          <Card key={event.id} className="border border-border bg-card overflow-hidden">
            {(event.coverImage || event.cover_image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={event.coverImage || event.cover_image || ''} 
                alt={event.title || event.name || 'Event cover'} 
                className="w-full aspect-video object-cover" 
              />
            ) : (
              <div className="w-full aspect-video bg-gradient-to-br from-secondary/20 to-primary/20" />
            )}
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-semibold text-foreground line-clamp-1">{event.title || event.name || 'Untitled Event'}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 
                  <span>{event.date || 'TBA'}</span>
                  {(event.startTime || event.start_time) && (
                    <span> • {event.startTime || event.start_time}</span>
                  )}
                </div>
                {(event.startTime || event.start_time) && (event.endTime || event.end_time) && (
                  <div>⏰ {event.startTime || event.start_time} - {event.endTime || event.end_time}</div>
                )}
                {(event.venue || event.location) && (
                  <div>📍 {event.venue || event.location}</div>
                )}
              </div>
              <div className="flex justify-end gap-1 pt-2">
                <Button variant="ghost" size="sm" title="View" onClick={() => router.push(`/admin/events/${event.id}`)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Edit" onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" title="Delete" onClick={() => setShowDeleteConfirm(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card max-w-sm">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Event</h2>
            <p className="text-muted-foreground mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
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
