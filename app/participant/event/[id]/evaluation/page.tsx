'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, AlertCircle, Loader2, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall, getAuthenticatedUserEmail, authApi } from '@/lib/api-config'

export default function ParticipantEvaluation() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<any>(null)
  const [registration, setRegistration] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; year_level?: string } | null>(null)
  const [formData, setFormData] = useState({
    contentRating: 4,
    instructorRating: 4,
    facilitiesRating: 4,
    overallRating: 4,
    yearLevel: '',
    feedback: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [eventStatus, setEventStatus] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authenticated user email
        const userEmail = await getAuthenticatedUserEmail()
        if (!userEmail) {
          setError('Please sign in to submit an evaluation.')
          setLoading(false)
          return
        }

        // Fetch user profile
        const profileResponse = await apiCall.get(authApi.me())
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.authenticated && profileData.user) {
            const user = profileData.user
            setUserProfile({
              name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
              email: user.email,
              year_level: '', // Will be filled by user
            })
          }
        }

        // Fetch event
        const eventUrl = api.eventById(params.id as string)
        const eventResponse = await apiCall.get(eventUrl)
        
        if (eventResponse.ok) {
          const apiEvent = await eventResponse.json()
          setEvent(apiEvent)
          setEventStatus(apiEvent.status || '')
        } else {
          setError('Event not found.')
          setLoading(false)
          return
        }

        // Fetch registration
        const regUrl = `${api.registrations()}?event=${params.id}&email=${encodeURIComponent(userEmail)}`
        const regResponse = await apiCall.get(regUrl)
        
        if (regResponse.ok) {
          const regData = await regResponse.json()
          const registrations = Array.isArray(regData) ? regData : (regData.results || regData.data || [])
          if (registrations.length > 0) {
            setRegistration(registrations[0])
          } else {
            setError('Registration not found. Please register for this event first.')
            setLoading(false)
            return
          }
        } else {
          setError('Could not fetch registration.')
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.error('[Evaluation] Error fetching data:', err)
        setError(err.message || 'Failed to load evaluation form.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])

  const handleSubmit = async () => {
    if (!registration || !userProfile) {
      alert('Missing registration or user information.')
      return
    }

    if (!formData.yearLevel.trim()) {
      alert('Please provide your year level.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        registration: registration.id,
        name: userProfile.name,
        email: userProfile.email,
        year_level: formData.yearLevel,
        content_rating: formData.contentRating,
        instructor_rating: formData.instructorRating,
        facilities_rating: formData.facilitiesRating,
        overall_rating: formData.overallRating,
        feedback: formData.feedback,
      }

      const response = await apiCall.post(api.evaluations(), payload)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        setError(errorData.detail || errorData.error || 'Failed to submit evaluation. Please make sure you have checked in and checked out.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error('[Evaluation] Error submitting:', err)
      setError(err.message || 'Network error while submitting evaluation.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Card className="p-8 border border-border bg-card text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading evaluation form...</p>
        </Card>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="p-6 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Card className="p-8 border border-border bg-card max-w-2xl mx-auto text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-destructive">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    )
  }

  // Gate evaluation form - only show if event is completed
  const normalizedStatus = (eventStatus || '').toLowerCase()
  if (normalizedStatus !== 'completed') {
    return (
      <div className="p-6 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card className="p-8 border border-border bg-card max-w-2xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Evaluation Not Available</h2>
            <p className="text-muted-foreground">
              This event has not been concluded yet. Evaluations will be available once the event organizer concludes the event.
            </p>
          </div>
          <Button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={() => router.push(`/participant/event/${params.id}`)}
          >
            Back to Event
          </Button>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Card className="p-8 border border-border bg-card max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-2">Your evaluation has been submitted successfully.</p>
            <p className="text-sm text-muted-foreground">
              Your certificate will be generated and sent to your email shortly.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              onClick={() => router.push(`/participant/event/${params.id}`)}
            >
              Back to Event
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/participant/certificates')}
            >
              View My Certificates
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const RatingSection = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      </div>
    </div>
  )

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

      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Evaluation</h1>
        <p className="text-muted-foreground mt-1">For {event?.title || event?.name || 'Event'}</p>
      </div>

      {error && (
        <Card className="p-4 border border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Evaluation Form */}
      <Card className="p-6 border border-border bg-card max-w-2xl space-y-6">
        {/* Year Level */}
        <div className="space-y-2">
          <Label htmlFor="yearLevel" className="text-sm font-medium text-foreground">
            Year Level <span className="text-destructive">*</span>
          </Label>
          <Input
            id="yearLevel"
            placeholder="e.g., 1st Year, 2nd Year, 3rd Year, 4th Year"
            value={formData.yearLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value }))}
            className="bg-background border-border"
            required
          />
        </div>

        {/* Ratings */}
        <div className="space-y-4">
          <Label className="text-base font-semibold text-foreground">Rate the following aspects:</Label>
          <RatingSection
            label="Content Quality"
            value={formData.contentRating}
            onChange={(value) => setFormData(prev => ({ ...prev, contentRating: value }))}
          />
          <RatingSection
            label="Instructor/Resource Speaker"
            value={formData.instructorRating}
            onChange={(value) => setFormData(prev => ({ ...prev, instructorRating: value }))}
          />
          <RatingSection
            label="Facilities/Venue"
            value={formData.facilitiesRating}
            onChange={(value) => setFormData(prev => ({ ...prev, facilitiesRating: value }))}
          />
          <RatingSection
            label="Overall Experience"
            value={formData.overallRating}
            onChange={(value) => setFormData(prev => ({ ...prev, overallRating: value }))}
          />
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-sm font-medium text-foreground">
            Additional Feedback (Optional)
          </Label>
          <Textarea
            id="feedback"
            placeholder="Share your thoughts, suggestions, or comments about the event..."
            value={formData.feedback}
            onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
            className="bg-background border-border min-h-32"
          />
        </div>

        {/* Submit Button */}
        <Button
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || !formData.yearLevel.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Evaluation'
          )}
        </Button>
      </Card>
    </div>
  )
}
