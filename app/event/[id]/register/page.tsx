'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Check } from 'lucide-react'

export default function EventRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Connect to Django backend for registration
    setTimeout(() => {
      setIsLoading(false)
      setIsCompleted(true)
    }, 1500)
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center border border-border bg-card space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Registration Complete!</h1>
            <p className="text-muted-foreground">You've successfully registered for the event. A confirmation email has been sent.</p>
          </div>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => router.push('/event/checkin')}
            >
              Check In with QR Code
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/my-events')}
            >
              View My Events
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-accent hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <Card className="border border-border bg-card p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Register for Event</h1>
              <p className="text-muted-foreground">Advanced Python Workshop</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@hcdc.edu.ph"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-background border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation" className="text-foreground">Affiliation *</Label>
                <select
                  id="affiliation"
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  required
                >
                  <option value="">Select your affiliation</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="alumni">Alumni</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  By registering, you agree to submit an evaluation after attending to receive your certificate.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
