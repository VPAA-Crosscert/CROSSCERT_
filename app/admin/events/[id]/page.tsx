'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Users, Edit, Trash2, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEventById, getStoredEvents } from '@/lib/event-context'
import { Event } from '@/lib/event-context'
import { adminApi, apiCall } from '@/lib/api-config'

export default function AdminEventDetail() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isConcluding, setIsConcluding] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      const eventId = params.id as string
      console.log('[Event Detail] ========================================')
      console.log('[Event Detail] Looking for event with ID:', eventId)
      console.log('[Event Detail] Event ID type:', typeof eventId)
      console.log('[Event Detail] ========================================')
      
      // First try to fetch from API
      try {
        const eventUrl = adminApi.eventById(eventId)
        console.log('[Event Detail] Fetching from API:', eventUrl)
        
        const response = await apiCall.get(eventUrl)
        console.log('[Event Detail] API response status:', response.status, response.statusText)
        
        if (response.ok) {
          const apiEvent = await response.json()
          console.log('[Event Detail] ✅ Event found in API!')
          console.log('[Event Detail] Event ID from API:', apiEvent.id, 'Type:', typeof apiEvent.id)
          console.log('[Event Detail] Event title:', apiEvent.title)
          console.log('[Event Detail] Full event data:', JSON.stringify(apiEvent, null, 2))
          
          // Always set the event if API returns it (the API endpoint should match the ID)
          setEvent(apiEvent as Event)
          setLoading(false)
          console.log('[Event Detail] ✅ Event set successfully')
          return
        } else {
          console.warn('[Event Detail] ❌ API request failed, status:', response.status)
          try {
            const errorData = await response.json()
            console.warn('[Event Detail] Error response (JSON):', errorData)
          } catch {
            const errorText = await response.text()
            console.warn('[Event Detail] Error response (text):', errorText)
          }
        }
      } catch (apiErr) {
        console.error('[Event Detail] ❌ API fetch error:', apiErr)
      }
      
      // Fallback to localStorage
      console.log('[Event Detail] Falling back to localStorage search')
      const storedEvents = getStoredEvents()
      console.log('[Event Detail] Stored events count:', storedEvents.length)
      console.log('[Event Detail] Stored events IDs:', storedEvents.map(e => ({ id: e.id, type: typeof e.id, title: e.title || e.name })))
      
      const foundEvent = getEventById(eventId)
      console.log('[Event Detail] Found event in localStorage:', foundEvent)
      
      if (foundEvent) {
        console.log('[Event Detail] ✅ Event found in localStorage')
        console.log('[Event Detail] Event ID from localStorage:', foundEvent.id, 'Type:', typeof foundEvent.id)
      } else {
        console.log('[Event Detail] ❌ Event NOT found in localStorage')
      }
      
      setEvent(foundEvent)
      setLoading(false)
    }
    
    fetchEvent()
  }, [params.id])

  const handleDelete = async () => {
    const eventId = params.id as string
    console.log('[Delete Event] Deleting event with ID:', eventId)
    setShowDeleteConfirm(false)
    
    try {
      // Delete from API
      const eventUrl = adminApi.eventById(eventId)
      console.log('[Delete Event] Deleting from API:', eventUrl)
      
      const response = await apiCall.delete(eventUrl)
      console.log('[Delete Event] Delete response status:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('[Delete Event] Failed to delete from API:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('[Delete Event] Error details:', errorText)
        alert(`Failed to delete event: ${response.status} ${response.statusText}`)
        setShowDeleteConfirm(true) // Re-show the modal if delete failed
        return
      }
      
      console.log('[Delete Event] ✅ Successfully deleted from API')
      
      // Optionally try to clean up localStorage (but don't fail if it's full)
      try {
        const existingNew = localStorage.getItem('crosscert_local_events')
        if (existingNew) {
          const filteredNew = JSON.parse(existingNew).filter((e: Event) => String(e.id) !== String(eventId))
          localStorage.setItem('crosscert_local_events', JSON.stringify(filteredNew))
          console.log('[Delete Event] Cleaned up crosscert_local_events')
        }
        const existingOld = localStorage.getItem('events')
        if (existingOld) {
          const filteredOld = JSON.parse(existingOld).filter((e: Event) => String(e.id) !== String(eventId))
          localStorage.setItem('events', JSON.stringify(filteredOld))
          console.log('[Delete Event] Cleaned up legacy events key')
        }
      } catch (lsErr) {
        // Ignore localStorage errors (it might be full, that's okay)
        console.warn('[Delete Event] Could not update localStorage (quota may be exceeded):', lsErr)
      }
      
      // Redirect to events list
      router.push('/admin/events')
    } catch (err: any) {
      console.error('[Delete Event] Error during delete:', err)
      alert(`Failed to delete event: ${err.message || 'Unknown error'}`)
      setShowDeleteConfirm(true) // Re-show the modal if delete failed
    }
  }

  const handleEdit = () => {
    router.push(`/admin/events/${params.id}/edit`)
  }

  const handleConcludeEvent = async () => {
    if (!event) return
    
    // Check status (backend uses lowercase, frontend might use different format)
    const currentStatus = (event.status || '').toLowerCase()
    if (currentStatus === 'completed') {
      alert('This event is already concluded.')
      return
    }

    if (!confirm('Are you sure you want to conclude this event? Once concluded, participants will be able to submit evaluations.')) {
      return
    }

    setIsConcluding(true)
    try {
      const eventUrl = adminApi.eventById(event.id)
      const concludeUrl = `${eventUrl}conclude/`
      
      console.log('[Conclude Event] Concluding event:', concludeUrl)
      const response = await apiCall.post(concludeUrl, {})
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to conclude event')
      }

      const data = await response.json()
      console.log('[Conclude Event] ✅ Event concluded:', data)
      
      // Update event status in state
      setEvent({ ...event, status: 'completed' as any })
      alert('Event concluded successfully! Participants can now submit evaluations.')
    } catch (err: any) {
      console.error('[Conclude Event] Error:', err)
      alert(err.message || 'Failed to conclude event. Please try again.')
    } finally {
      setIsConcluding(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    )
  }

  if (!event) {
    console.error('[Event Detail] Event not found!')
    console.error('[Event Detail] Searched ID:', params.id)
    console.error('[Event Detail] ID type:', typeof params.id)
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <p className="text-sm text-muted-foreground mt-2">ID: {params.id}</p>
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
        <div className="aspect-video bg-linear-to-br from-secondary/20 to-primary/20 rounded-lg border border-border" />
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
              <p className={`font-semibold ${
                (event.status || '').toLowerCase() === 'completed' ? 'text-green-600' :
                (event.status || '').toLowerCase() === 'live' ? 'text-blue-600' :
                (event.status || '').toLowerCase() === 'scheduled' ? 'text-yellow-600' :
                'text-foreground'
              }`}>
                {(event.status || 'draft').charAt(0).toUpperCase() + (event.status || 'draft').slice(1)}
              </p>
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
            {(event.status || '').toLowerCase() !== 'completed' && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                onClick={handleConcludeEvent}
                disabled={isConcluding}
              >
                <CheckCircle className="w-4 h-4" />
                {isConcluding ? 'Concluding...' : 'Conclude Event'}
              </Button>
            )}
            
            {(event.status || '').toLowerCase() === 'completed' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-sm font-semibold text-green-800">Event Concluded</p>
                <p className="text-xs text-green-600 mt-1">Evaluations are now enabled</p>
              </div>
            )}

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
