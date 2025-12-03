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

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    speakers: '',
  })

  useEffect(() => {
    const foundEvent = getEventById(params.id as string)
    if (foundEvent) {
      setEvent(foundEvent)
      setFormData({
        name: foundEvent.name,
        description: foundEvent.description,
        date: foundEvent.date,
        startTime: foundEvent.startTime,
        endTime: foundEvent.endTime,
        venue: foundEvent.venue,
        speakers: foundEvent.speakers,
      })
    }
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update event in localStorage (both new and legacy keys)
    try {
      const existingNew = JSON.parse(localStorage.getItem('crosscert_local_events') || '[]')
      const updatedNew = existingNew.map((e: Event) =>
        String(e.id) === String(params.id) ? { ...e, ...formData } : e
      )
      localStorage.setItem('crosscert_local_events', JSON.stringify(updatedNew))
    } catch (err) {
      console.warn('Failed to update crosscert_local_events', err)
    }
    try {
      const existingOld = JSON.parse(localStorage.getItem('events') || '[]')
      const updatedOld = existingOld.map((e: Event) =>
        String(e.id) === String(params.id) ? { ...e, ...formData } : e
      )
      localStorage.setItem('events', JSON.stringify(updatedOld))
    } catch (err) {
      console.warn('Failed to update legacy events key', err)
    }

    setIsLoading(false)
    router.push(`/admin/events/${params.id}`)
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

      {/* Edit Form */}
      <Card className="p-6 border border-border bg-card space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground">Event Name</Label>
          <Input
            name="name"
            value={formData.name}
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
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="bg-background border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">End Time</Label>
          <Input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Venue</Label>
          <Input
            name="venue"
            value={formData.venue}
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
