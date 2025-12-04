'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Event, getEventById } from '@/lib/event-context'
import { adminApi, apiCall } from '@/lib/api-config'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    speakers: '',
  })

  useEffect(() => {
    const fetchEvent = async () => {
      const eventId = params.id as string
      console.log('[Edit Event] Looking for event with ID:', eventId)
      
      // First try to fetch from API
      try {
        const eventUrl = adminApi.eventById(eventId)
        console.log('[Edit Event] Fetching from API:', eventUrl)
        
        const response = await apiCall.get(eventUrl)
        console.log('[Edit Event] API response status:', response.status, response.statusText)
        
        if (response.ok) {
          const apiEvent = await response.json()
          console.log('[Edit Event] ✅ Event found in API!')
          console.log('[Edit Event] Event title:', apiEvent.title)
          
          setEvent(apiEvent as Event)
          
          // Map API fields to form data (handle both camelCase and snake_case)
          setFormData({
            title: apiEvent.title || apiEvent.name || '',
            description: apiEvent.description || '',
            date: apiEvent.date || '',
            start_time: apiEvent.start_time || apiEvent.startTime || '',
            end_time: apiEvent.end_time || apiEvent.endTime || '',
            location: apiEvent.location || apiEvent.venue || '',
            speakers: Array.isArray(apiEvent.speakers) 
              ? apiEvent.speakers.join(', ') 
              : (apiEvent.speakers || ''),
          })
          
          setLoading(false)
          return
        } else {
          console.warn('[Edit Event] ❌ API request failed, status:', response.status)
          try {
            const errorData = await response.json()
            console.warn('[Edit Event] Error response (JSON):', errorData)
          } catch {
            const errorText = await response.text()
            console.warn('[Edit Event] Error response (text):', errorText)
          }
        }
      } catch (apiErr) {
        console.error('[Edit Event] ❌ API fetch error:', apiErr)
      }
      
      // Fallback to localStorage
      console.log('[Edit Event] Falling back to localStorage search')
      const foundEvent = getEventById(eventId)
      if (foundEvent) {
        setEvent(foundEvent)
        setFormData({
          title: foundEvent.title || foundEvent.name || '',
          description: foundEvent.description || '',
          date: foundEvent.date || '',
          start_time: foundEvent.start_time || foundEvent.startTime || '',
          end_time: foundEvent.end_time || foundEvent.endTime || '',
          location: foundEvent.location || foundEvent.venue || '',
          speakers: foundEvent.speakers || '',
        })
      }
      
      setLoading(false)
    }
    
    fetchEvent()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const eventId = params.id as string
      const eventUrl = adminApi.eventById(eventId)
      console.log('[Edit Event] Updating event at:', eventUrl)
      
      // Prepare payload for API (convert speakers string to array if needed)
      const payload = {
        ...formData,
        speakers: formData.speakers 
          ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }
      
      console.log('[Edit Event] Payload:', payload)
      
      const response = await apiCall.patch(eventUrl, payload)
      console.log('[Edit Event] Update response status:', response.status, response.statusText)
      
      if (!response.ok) {
        let errorMessage = `Failed to update event: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('[Edit Event] Error response:', errorData)
          errorMessage = errorData.error || errorData.detail || errorMessage
          // Handle validation errors
          if (errorData.title || errorData.date || errorData.start_time) {
            const validationErrors = Object.entries(errorData)
              .filter(([key]) => key !== 'error' && key !== 'detail')
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ')
            if (validationErrors) {
              errorMessage = `Validation errors: ${validationErrors}`
            }
          }
        } catch {
          // If JSON parsing fails, use status text
        }
        throw new Error(errorMessage)
      }

      const updatedEvent = await response.json()
      console.log('[Edit Event] ✅ Successfully updated event:', updatedEvent)
      
      setIsLoading(false)
      router.push(`/admin/events/${params.id}`)
    } catch (err: any) {
      console.error('[Edit Event] Error updating event:', err)
      setError(err.message || 'Failed to update event')
      setIsLoading(false)
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
    console.error('[Edit Event] Event not found!')
    console.error('[Edit Event] Searched ID:', params.id)
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <p className="text-sm text-muted-foreground mt-2">ID: {params.id}</p>
        <Button onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
        <p className="text-muted-foreground mt-1">Update event details</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Edit Form */}
      <Card className="p-6 border border-border bg-card space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground">Event Name</Label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="bg-background border-border text-foreground min-h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Date</Label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Start Time</Label>
            <Input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">End Time</Label>
          <Input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Venue</Label>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Speakers</Label>
          <Input
            name="speakers"
            value={formData.speakers}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
