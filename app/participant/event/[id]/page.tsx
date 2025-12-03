'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Calendar, Users, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEventById, getRegistrationStatus, updateRegistrationStatus } from '@/lib/event-context'
import { SuccessModal } from '@/components/success-modal'
import { Event } from '@/lib/event-context'

export default function ParticipantEventDetail() {
  const router = useRouter()
  const params = useParams()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<'registered' | 'checked-in' | 'evaluated' | 'none'>('none')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [buttonLabel, setButtonLabel] = useState('Register Now')

  useEffect(() => {
    const foundEvent = getEventById(params.id as string)
    setEvent(foundEvent)
    
    const status = getRegistrationStatus(params.id as string)
    setRegistrationStatus(status)
    
    if (status === 'registered') {
      setButtonLabel('Check In')
    } else if (status === 'checked-in') {
      setButtonLabel('Complete Evaluation')
    } else if (status === 'evaluated') {
      setButtonLabel('View Certificate')
    } else {
      setButtonLabel('Register Now')
    }
  }, [params.id])

  const handleRegister = () => {
    updateRegistrationStatus(params.id as string, 'registered')
    setRegistrationStatus('registered')
    setButtonLabel('Check In')
    setShowSuccessModal(true)
  }

  const handleCheckIn = () => {
    updateRegistrationStatus(params.id as string, 'checked-in')
    setRegistrationStatus('checked-in')
    setButtonLabel('Complete Evaluation')
    router.push(`/participant/event/${params.id}/evaluation`)
  }

  const handleEvaluation = () => {
    router.push(`/participant/event/${params.id}/evaluation`)
  }

  const handleViewCertificate = () => {
    router.push(`/participant/certificates`)
  }

  const handleMainAction = () => {
    if (registrationStatus === 'none') {
      handleRegister()
    } else if (registrationStatus === 'registered') {
      handleCheckIn()
    } else if (registrationStatus === 'checked-in') {
      handleEvaluation()
    } else if (registrationStatus === 'evaluated') {
      handleViewCertificate()
    }
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
      <div className="aspect-video bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg border border-border" />

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{event.name}</h1>
            <p className="text-muted-foreground">{event.department}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Date & Time</span>
              </div>
              <p className="font-semibold text-foreground">{event.date}</p>
              <p className="text-sm text-muted-foreground">{event.startTime} - {event.endTime}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Location</span>
              </div>
              <p className="font-semibold text-foreground text-sm">{event.venue}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Speaker</p>
              <p className="font-semibold text-foreground">{event.speakers}</p>
            </Card>

            <Card className="p-4 border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <p className="font-semibold text-foreground capitalize">{registrationStatus === 'none' ? 'Not Registered' : registrationStatus}</p>
            </Card>
          </div>

          {/* Description */}
          <Card className="p-6 border border-border bg-card space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-6 border border-border bg-card sticky top-20 space-y-4">
            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
              size="lg"
              onClick={handleMainAction}
            >
              {buttonLabel}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark Event'}
            </Button>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Status: <span className="font-semibold text-foreground capitalize">{registrationStatus === 'none' ? 'Not Registered' : registrationStatus}</span></p>
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal - After Registration */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Successfully Registered!"
        message={`You have successfully registered for ${event.name}.`}
        actionLabel="View QR Code"
        onClose={() => {
          setShowSuccessModal(false)
          router.push(`/participant/event/${params.id}/qrcode`)
        }}
        onAction={() => {
          router.push(`/participant/event/${params.id}/qrcode`)
        }}
      />
    </div>
  )
}
