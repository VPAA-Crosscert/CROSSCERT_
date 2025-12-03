'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Check, Star } from 'lucide-react'
import { api } from '@/lib/api-config'

export default function EvaluationPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    yearLevel: '',
    contentRating: '4',
    instructorRating: '4',
    facilitiesRating: '4',
    overallRating: '4',
    feedback: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const eventId = params.id as string
      const email = formData.email
      const resReg = await fetch(`${api.registrations()}/?event=${encodeURIComponent(eventId)}&email=${encodeURIComponent(email)}`)
      const registrations = await resReg.json()
      if (!Array.isArray(registrations) || registrations.length === 0) {
        alert('Registration not found for this email.')
        setIsLoading(false)
        return
      }
      const registration = registrations[0]

      const payload = {
        registration: registration.id,
        name: formData.name,
        email: formData.email,
        year_level: formData.yearLevel,
        content_rating: parseInt(formData.contentRating),
        instructor_rating: parseInt(formData.instructorRating),
        facilities_rating: parseInt(formData.facilitiesRating),
        overall_rating: parseInt(formData.overallRating),
        feedback: formData.feedback,
      }

      const resEval = await fetch(api.evaluations(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!resEval.ok) {
        const data = await resEval.json().catch(() => ({}))
        alert(data.detail || 'Unable to submit evaluation. Make sure you have checked in and out.')
        setIsLoading(false)
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      alert('Network error while submitting evaluation.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center border border-border bg-card space-y-6">
          <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Thank You!</h1>
            <p className="text-muted-foreground">Your evaluation has been submitted successfully. Your certificate will be generated shortly.</p>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push('/my-certificates')}
          >
            View My Certificates
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-accent hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <Card className="border border-border bg-card p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Event Evaluation</h1>
              <p className="text-muted-foreground">Advanced Python Workshop - November 20, 2025</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Participant Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Your Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearLevel" className="text-foreground">Year Level</Label>
                  <select
                    id="yearLevel"
                    name="yearLevel"
                    value={formData.yearLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    required
                  >
                    <option value="">Select year level</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Ratings */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Ratings</h2>

                {[
                  { name: 'contentRating', label: 'Content Quality & Relevance' },
                  { name: 'instructorRating', label: 'Instructor Presentation' },
                  { name: 'facilitiesRating', label: 'Venue & Facilities' },
                  { name: 'overallRating', label: 'Overall Experience' },
                ].map(item => (
                  <div key={item.name} className="space-y-3">
                    <Label className="text-foreground">{item.label}</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, [item.name]: rating.toString() }))}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              parseInt(formData[item.name as keyof typeof formData]) >= rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-foreground">Additional Feedback</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  placeholder="Share your thoughts, suggestions, or improvements..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none"
                  rows={6}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              >
                {isLoading ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
