'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, CheckCircle, Star, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall, adminApi } from '@/lib/api-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type EvaluationRecord = {
  id: number
  registration: number
  name: string
  email: string
  year_level: string
  content_rating: number
  instructor_rating: number
  facilities_rating: number
  overall_rating: number
  feedback: string
  submitted_at: string
  event_title?: string
  event_id?: number
  participant_name?: string
}

type EventRecord = {
  id: number
  title: string
  status: string
}

export default function AdminEvaluations() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events and evaluations
        const [eventsRes, evaluationsRes] = await Promise.all([
          apiCall.get(adminApi.events()),
          apiCall.get(api.evaluations()),
        ])

        if (!eventsRes.ok || !evaluationsRes.ok) {
          throw new Error('Unable to load evaluations data.')
        }

        const eventsData = await eventsRes.json()
        const evaluationsData = await evaluationsRes.json()

        // Handle paginated responses
        const eventsList: EventRecord[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.results || eventsData.data || [])
        
        const evaluationsList: EvaluationRecord[] = Array.isArray(evaluationsData)
          ? evaluationsData
          : (evaluationsData.results || evaluationsData.data || [])

        // Fetch registration details for each evaluation to get event info
        const enrichedEvaluations = await Promise.all(
          evaluationsList.map(async (evaluation) => {
            try {
              const regRes = await apiCall.get(`${api.registrations()}/${evaluation.registration}/`)
              if (regRes.ok) {
                const reg = await regRes.json()
                // Fetch event details
                const eventRes = await apiCall.get(api.eventById(reg.event))
                if (eventRes.ok) {
                  const event = await eventRes.json()
                  return {
                    ...evaluation,
                    event_title: event.title,
                    event_id: event.id,
                    participant_name: `${reg.first_name} ${reg.last_name}`,
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch details for evaluation ${evaluation.id}:`, err)
            }
            return evaluation
          })
        )

        setEvents(eventsList)
        setEvaluations(enrichedEvaluations)
      } catch (err: any) {
        setError(err.message || 'Unable to load evaluations.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch = 
      evaluation.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.participant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEvent = selectedEvent === 'all' || String(evaluation.event_id) === selectedEvent
    
    return matchesSearch && matchesEvent
  })

  // Group by event
  const evaluationsByEvent = filteredEvaluations.reduce((acc, evaluation) => {
    const eventId = evaluation.event_id || 'unknown'
    if (!acc[eventId]) {
      acc[eventId] = []
    }
    acc[eventId].push(evaluation)
    return acc
  }, {} as Record<string, EvaluationRecord[]>)

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
        <h1 className="text-3xl font-bold text-foreground">Event Evaluations</h1>
        <p className="text-muted-foreground mt-1">View and manage participant evaluations</p>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-border bg-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Evaluations List */}
      {loading ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-muted-foreground">Loading evaluations...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-destructive">{error}</p>
        </Card>
      ) : filteredEvaluations.length === 0 ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-muted-foreground">No evaluations found</p>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Evaluations ({filteredEvaluations.length})</TabsTrigger>
            <TabsTrigger value="by-event">By Event</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="p-4 border border-border bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {evaluation.participant_name || evaluation.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{evaluation.email}</p>
                    <p className="text-sm font-medium text-foreground mb-3">
                      Event: {evaluation.event_title || 'Unknown Event'}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Content</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{evaluation.content_rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Instructor</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{evaluation.instructor_rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Facilities</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{evaluation.facilities_rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Overall</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-foreground">{evaluation.overall_rating}/5</span>
                        </div>
                      </div>
                    </div>

                    {evaluation.feedback && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                        <p className="text-sm text-foreground">{evaluation.feedback}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      Submitted: {new Date(evaluation.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="by-event" className="space-y-6">
            {Object.entries(evaluationsByEvent).map(([eventId, eventEvaluations]) => {
              const event = events.find(e => String(e.id) === eventId)
              return (
                <div key={eventId} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {event?.title || `Event ${eventId}`} ({eventEvaluations.length} evaluations)
                  </h3>
                  {eventEvaluations.map((evaluation) => (
                    <Card key={evaluation.id} className="p-4 border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">
                            {evaluation.participant_name || evaluation.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">{evaluation.email}</p>
                          
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-foreground">
                                Overall: {evaluation.overall_rating}/5
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(evaluation.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

