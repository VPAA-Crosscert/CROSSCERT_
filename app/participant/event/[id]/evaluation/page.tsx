'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { updateRegistrationStatus, getEventById } from '@/lib/event-context'
import { Textarea } from '@/components/ui/textarea'

export default function ParticipantEvaluation() {
  const router = useRouter()
  const params = useParams()
  const [event, setEvent] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const foundEvent = getEventById(params.id as string)
    setEvent(foundEvent)
  }, [params.id])

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please provide a rating')
      return
    }

    // Save evaluation
    const evaluations = JSON.parse(localStorage.getItem('evaluations') || '{}')
    evaluations[params.id as string] = {
      rating,
      feedback,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('evaluations', JSON.stringify(evaluations))

    // Update registration status to evaluated
    updateRegistrationStatus(params.id as string, 'evaluated')
    setSubmitted(true)
  }

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Card className="p-8 border border-border bg-card max-w-md w-full space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your evaluation has been submitted successfully.</p>
          </div>
          <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={() => router.push(`/participant/event/${params.id}`)}
          >
            Back to Event
          </Button>
        </Card>
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

      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Evaluation</h1>
        <p className="text-muted-foreground mt-1">For {event.name}</p>
      </div>

      {/* Evaluation Form */}
      <Card className="p-6 border border-border bg-card max-w-2xl space-y-6">
        {/* Rating */}
        <div>
          <label className="text-lg font-semibold text-foreground mb-4 block">How would you rate this event?</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="text-lg font-semibold text-foreground mb-2 block">Feedback</label>
          <Textarea
            placeholder="Share your feedback about the event..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="bg-background border-border min-h-32"
          />
        </div>

        {/* Submit Button */}
        <Button
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
          size="lg"
          onClick={handleSubmit}
        >
          Submit Evaluation
        </Button>
      </Card>
    </div>
  )
}
