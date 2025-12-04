'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from 'react'
import { api, apiCall, getAuthenticatedUserEmail } from '@/lib/api-config'

type Registration = {
  id: number
  event: number
  email: string
  first_name: string
  last_name: string
  registered_at: string
  qr_code?: string
  qr_code_value?: string
  is_present: boolean
  has_evaluated: boolean
}

type EventWithRegistration = {
  id: number
  title: string
  name?: string
  date: string
  start_time?: string
  startTime?: string
  end_time?: string
  endTime?: string
  location?: string
  venue?: string
  status?: string
  registration: Registration
}

export default function MyEvents() {
  const router = useRouter()
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithRegistration[]>([])
  const [pastEvents, setPastEvents] = useState<EventWithRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchMyEvents = async () => {
      // Get authenticated user's email from API session (not localStorage)
      const userEmail = await getAuthenticatedUserEmail()
      if (!userEmail) {
        setError('Please sign in to view your events.')
        setLoading(false)
        return
      }
      
      console.log('[My Events] Authenticated user email:', userEmail)

      try {
        // Fetch user's registrations
        // api.registrations() already ends with /, so we use ? not /?
        const baseUrl = api.registrations().endsWith('/') 
          ? api.registrations().slice(0, -1) 
          : api.registrations()
        const registrationsUrl = `${baseUrl}/?email=${encodeURIComponent(userEmail)}`
        console.log('[My Events] ========================================')
        console.log('[My Events] Fetching user registrations')
        console.log('[My Events] User email:', userEmail)
        console.log('[My Events] Registrations URL:', registrationsUrl)
        
        const regsRes = await apiCall.get(registrationsUrl)
        console.log('[My Events] Response status:', regsRes.status, regsRes.statusText)
        
        if (!regsRes.ok) {
          console.error('[My Events] ❌ Failed to fetch registrations:', regsRes.status, regsRes.statusText)
          let errorText = ''
          try {
            const errorData = await regsRes.json()
            console.error('[My Events] Error response:', errorData)
            errorText = errorData.detail || errorData.error || 'Unable to load your registrations.'
          } catch {
            errorText = `Unable to load your registrations: ${regsRes.status} ${regsRes.statusText}`
          }
          throw new Error(errorText)
        }
        
        const regsData = await regsRes.json()
        console.log('[My Events] Raw registrations data:', regsData)
        
        let registrations: Registration[] = Array.isArray(regsData)
          ? regsData
          : (regsData.results || regsData.data || [])
        
        // CLIENT-SIDE FILTER: Ensure we only show registrations for the authenticated user
        // This is a safety measure in case backend filtering fails
        registrations = registrations.filter(reg => {
          const matches = reg.email.toLowerCase() === userEmail.toLowerCase()
          if (!matches) {
            console.warn(`[My Events] ⚠️ Filtered out registration with wrong email: ${reg.email} (expected: ${userEmail})`)
          }
          return matches
        })
        
        console.log('[My Events] ✅ Found registrations (after filtering):', registrations.length)
        console.log('[My Events] Registration IDs:', registrations.map(r => ({ 
          id: r.id, 
          event: r.event, 
          email: r.email,
          qr_code_value: r.qr_code_value 
        })))
        
        if (registrations.length === 0) {
          setLoading(false)
          return
        }
        
        // Fetch event details for each registration
        const eventIds = [...new Set(registrations.map(r => r.event))]
        console.log('[My Events] Unique event IDs to fetch:', eventIds)
        const eventsMap = new Map<number, EventWithRegistration>()
        
        for (const eventId of eventIds) {
          try {
            const eventUrl = api.eventById(eventId)
            console.log(`[My Events] Fetching event ${eventId} from:`, eventUrl)
            const eventRes = await apiCall.get(eventUrl)
            console.log(`[My Events] Event ${eventId} response status:`, eventRes.status)
            
            if (eventRes.ok) {
              const eventData = await eventRes.json()
              console.log(`[My Events] ✅ Event ${eventId} data:`, {
                id: eventData.id,
                title: eventData.title,
                date: eventData.date,
              })
              
              const registration = registrations.find(r => r.event === eventId && r.email.toLowerCase() === userEmail.toLowerCase())
              console.log(`[My Events] Registration for event ${eventId}:`, {
                id: registration?.id,
                email: registration?.email,
                qr_code_value: registration?.qr_code_value,
                is_present: registration?.is_present,
              })
              
              if (registration) {
                // Double-check: ensure registration email matches authenticated user
                if (registration.email.toLowerCase() !== userEmail.toLowerCase()) {
                  console.warn(`[My Events] ⚠️ Registration email mismatch! Registration: ${registration.email}, User: ${userEmail}`)
                  continue // Skip this registration
                }
                
                eventsMap.set(eventId, {
                  ...eventData,
                  registration,
                })
                console.log(`[My Events] ✅ Added event ${eventId} to map`)
              } else {
                console.warn(`[My Events] ⚠️ No registration found for event ${eventId} with email ${userEmail}`)
              }
            } else {
              console.error(`[My Events] ❌ Failed to fetch event ${eventId}:`, eventRes.status, eventRes.statusText)
            }
          } catch (err) {
            console.error(`[My Events] ❌ Error fetching event ${eventId}:`, err)
          }
        }
        
        console.log('[My Events] Events map size:', eventsMap.size)
        
        const allEvents = Array.from(eventsMap.values())
        console.log('[My Events] Total events with details:', allEvents.length)
        
        // Separate upcoming and past events
        const now = new Date()
        console.log('[My Events] Current date/time:', now.toISOString())
        const upcoming: EventWithRegistration[] = []
        const past: EventWithRegistration[] = []
        
        allEvents.forEach(event => {
          const eventDate = new Date(event.date)
          console.log(`[My Events] Event ${event.id} date:`, eventDate.toISOString(), 'vs now:', now.toISOString())
          if (eventDate >= now) {
            upcoming.push(event)
            console.log(`[My Events] Event ${event.id} is upcoming`)
          } else {
            past.push(event)
            console.log(`[My Events] Event ${event.id} is past`)
          }
        })
        
        // Sort upcoming by date (earliest first)
        upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        // Sort past by date (most recent first)
        past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        console.log('[My Events] Upcoming events count:', upcoming.length)
        console.log('[My Events] Past events count:', past.length)
        console.log('[My Events] ========================================')
        
        setUpcomingEvents(upcoming)
        setPastEvents(past)
        
      } catch (err: any) {
        console.error('[My Events] Error:', err)
        setError(err.message || 'Unable to load your events.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMyEvents()
  }, [])

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
          {loading ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-muted-foreground">Loading your events...</p>
            </Card>
          ) : error ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-destructive">{error}</p>
            </Card>
          ) : upcomingEvents.length === 0 ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-muted-foreground">No upcoming events</p>
            </Card>
          ) : (
            upcomingEvents.map((event) => {
              const eventDate = new Date(event.date)
              const formattedDate = eventDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })
              const startTime = event.start_time || event.startTime || ''
              const location = event.location || event.venue || 'TBA'
              
              return (
                <Card key={event.id} className="p-4 border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">
                        {event.title || event.name || 'Untitled Event'}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formattedDate} {startTime && `• ${startTime}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location}
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
                      {!event.registration.is_present ? (
                        <Button
                          size="sm"
                          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                          onClick={() => router.push(`/participant/event/${event.id}`)}
                        >
                          Check In
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Checked In
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Past Events */}
        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-muted-foreground">Loading your events...</p>
            </Card>
          ) : error ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-destructive">{error}</p>
            </Card>
          ) : pastEvents.length === 0 ? (
            <Card className="p-8 border border-border bg-card text-center">
              <p className="text-muted-foreground">No past events</p>
            </Card>
          ) : (
            pastEvents.map((event) => {
              const eventDate = new Date(event.date)
              const formattedDate = eventDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })
              const location = event.location || event.venue || 'TBA'
              const attended = event.registration.is_present
              const evaluated = event.registration.has_evaluated
              
              return (
                <Card key={event.id} className="p-4 border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">
                        {event.title || event.name || 'Untitled Event'}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className={`w-4 h-4 ${attended ? 'text-green-500' : 'text-muted-foreground'}`} />
                          {attended ? 'Attended' : 'Not Attended'}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className={`w-4 h-4 ${evaluated ? 'text-green-500' : 'text-orange-500'}`} />
                          {evaluated ? 'Evaluated' : 'Pending Evaluation'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!evaluated && attended && (event.status === 'completed' || (event.status || '').toLowerCase() === 'completed') && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => router.push(`/participant/event/${event.id}/evaluation`)}
                        >
                          Evaluate
                        </Button>
                      )}
                      {!evaluated && attended && event.status !== 'completed' && (event.status || '').toLowerCase() !== 'completed' && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          <span>Evaluation pending event conclusion</span>
                        </div>
                      )}
                      {evaluated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/participant/certificates`)}
                        >
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
