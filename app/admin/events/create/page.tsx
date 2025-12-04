'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, MapPin, CalendarIcon, Clock, Users, Ruler, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { adminApi, apiRequest, authApi, apiCall } from '@/lib/api-config'

const COLLEGES = {
  'College of Criminal Justice Education': [],
  'College of Engineering and Technology': [
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Mechanical Engineering',
    'Bachelor of Science in Electronics and Communication Engineering',
  ],
  'College of Hospitality & Tourism Management': [
    'Bachelor of Science in Hotel and Restaurant Management',
    'Bachelor of Science in Tourism Management',
  ],
  'College of Arts & Sciences': [
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Nursing',
    'Bachelor of Arts in English',
    'Bachelor of Science in Biology',
    'Bachelor of Science in Chemistry',
  ],
  'College of Maritime Education': ['Bachelor of Science in Marine Transportation (BSMT)'],
}

const THEMES = [
  { id: 1, name: 'Professional Blue', color: 'bg-blue-600', accent: '#2563eb' },
  { id: 2, name: 'Tech Purple', color: 'bg-purple-600', accent: '#7c3aed' },
  { id: 3, name: 'Vibrant Red', color: 'bg-red-600', accent: '#dc2626' },
  { id: 4, name: 'Forest Green', color: 'bg-green-600', accent: '#15803d' },
  { id: 5, name: 'Ocean Teal', color: 'bg-teal-600', accent: '#0d9488' },
  { id: 6, name: 'Sunset Orange', color: 'bg-orange-600', accent: '#ea580c' },
  { id: 7, name: 'Midnight Navy', color: 'bg-slate-800', accent: '#1e293b' },
  { id: 8, name: 'Rose Pink', color: 'bg-pink-600', accent: '#db2777' },
  { id: 9, name: 'Gold Yellow', color: 'bg-yellow-500', accent: '#eab308' },
  { id: 10, name: 'Indigo', color: 'bg-indigo-600', accent: '#4f46e5' },
]

const COORDINATE_DEFAULTS = {
  name: { x: 561, y: 420 },
  eventTitle: { x: 561, y: 360 },
  date: { x: 561, y: 300 },
}

const CERTIFICATE_DIMENSION = { width: 1123, height: 794 }

const INITIAL_COORDINATES = {
  name: { ...COORDINATE_DEFAULTS.name },
  eventTitle: { ...COORDINATE_DEFAULTS.eventTitle },
  date: { ...COORDINATE_DEFAULTS.date },
}

export default function CreateEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize CSRF token on component mount
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await apiRequest(authApi.csrfToken(), {
          method: 'GET',
        })
      } catch (err) {
        console.error('Failed to initialize CSRF token:', err)
      }
    }
    
    initializeCsrf()
  }, [])

  // Event details
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Manila')
  const [speakers, setSpeakers] = useState('')
  const [venue, setVenue] = useState('')
  const [eventCategory, setEventCategory] = useState('HCDC')
  const [departmentCategory, setDepartmentCategory] = useState('')

  // Event options
  const [hasCapacityLimit, setHasCapacityLimit] = useState(false)
  const [capacity, setCapacity] = useState('100')
  const [requireApproval, setRequireApproval] = useState(false)
  const [isPaidEvent, setIsPaidEvent] = useState(false)
  const [ticketPrice, setTicketPrice] = useState('0')
  const [isPublic, setIsPublic] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState(1)

  // Certificate data
  const [certificateTemplate, setCertificateTemplate] = useState('')
  const [certificateError, setCertificateError] = useState('')
  const [certificateCoordinates, setCertificateCoordinates] = useState(INITIAL_COORDINATES)
  const [sampleName, setSampleName] = useState('Juan Dela Cruz')
  const [sampleEventTitle, setSampleEventTitle] = useState('Sample Event Title')
  const [sampleDate, setSampleDate] = useState('January 01, 2025')

  // Drag & drop state for coordinate mapping
  const [draggingField, setDraggingField] = useState<keyof typeof INITIAL_COORDINATES | null>(null)
  const certificatePreviewRef = useRef<HTMLDivElement | null>(null)

  // Actual certificate image size (from uploaded template); used so
  // coordinates match the real PDF dimensions from the backend.
  const [certificateSize, setCertificateSize] = useState(CERTIFICATE_DIMENSION)

  const totalSteps = 6

  const isStep1Valid = eventName && eventDescription && eventDate && startTime && endTime && venue
  const isStep2Valid = !hasCapacityLimit || (hasCapacityLimit && Number(capacity) > 0)
  const isCertificateReady = Boolean(certificateTemplate)

  const activeTheme = useMemo(() => THEMES.find(t => t.id === selectedTheme) ?? THEMES[0], [selectedTheme])

  async function compressImageToBase64(
    file: File,
    opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
  ): Promise<string> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = opts || {}
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
    const targetW = Math.round(bitmap.width * ratio)
    const targetH = Math.round(bitmap.height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    const isPNG = file.type === 'image/png'
    const mime = isPNG ? 'image/png' : 'image/jpeg'
    return canvas.toDataURL(mime, mime === 'image/jpeg' ? quality : undefined)
  }

  async function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function validateCertificateTemplate(dataUrl: string) {
    return new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => {
        // Accept any landscape orientation (width > height)
        resolve(img.width > img.height)
      }
      img.onerror = () => resolve(false)
      img.src = dataUrl
    })
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await compressImageToBase64(file)
    setCoverImage(base64)
  }

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    const isValid = await validateCertificateTemplate(dataUrl)
    if (!isValid) {
      setCertificateError('Template must be in landscape orientation (wider than tall)')
      return
    }
    setCertificateError('')
    setCertificateTemplate(dataUrl)

    // Detect actual image dimensions so coordinate system matches backend
    const img = new Image()
    img.onload = () => {
      setCertificateSize({
        width: img.width || CERTIFICATE_DIMENSION.width,
        height: img.height || CERTIFICATE_DIMENSION.height,
      })
    }
    img.src = dataUrl
  }

  const handleCoordinateChange = (field: keyof typeof INITIAL_COORDINATES, axis: 'x' | 'y', value: number) => {
    setCertificateCoordinates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [axis]: value,
      },
    }))
  }

  // Handle drag start for overlay text
  const handleDragStart = (field: keyof typeof INITIAL_COORDINATES, e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingField(field)
  }

  // Global mouse move / up listeners for dragging
  useEffect(() => {
    if (!draggingField) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!certificatePreviewRef.current) return
      const rect = certificatePreviewRef.current.getBoundingClientRect()

      // Clamp pointer inside the preview bounds
      const clampedX = Math.min(Math.max(e.clientX, rect.left), rect.right)
      const clampedY = Math.min(Math.max(e.clientY, rect.top), rect.bottom)

      const relX = clampedX - rect.left
      const relYFromTop = clampedY - rect.top

      // Convert from DOM coordinates (origin top-left) to certificate coordinates (origin bottom-left)
      const x = (relX / rect.width) * certificateSize.width
      const yFromBottom =
        certificateSize.height - (relYFromTop / rect.height) * certificateSize.height

      setCertificateCoordinates(prev => ({
        ...prev,
        [draggingField]: {
          ...prev[draggingField],
          x: Math.round(x),
          y: Math.round(yFromBottom),
        },
      }))
    }

    const handleMouseUp = () => {
      setDraggingField(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingField, certificateSize.height, certificateSize.width])

  const handleCreateEvent = async () => {
    // Post event to backend API
    setIsLoading(true)
    setError('')
    try {
      const payload = {
        title: eventName,
        description: eventDescription,
        date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location: venue,
        capacity: hasCapacityLimit ? Number(capacity) : 1000,
        status: 'scheduled',
        speakers: speakers ? speakers.split(',').map(s => s.trim()).filter(Boolean) : [],
        timezone,
        category: eventCategory === 'outside' ? 'outside' : eventCategory,
        department: departmentCategory,
        theme: activeTheme.name,
        cover_image: coverImage,
        is_public: isPublic,
        require_approval: requireApproval,
        is_paid_event: isPaidEvent,
        ticket_price: isPaidEvent ? Number(ticketPrice || 0) : 0,
        certificate_template_image: certificateTemplate,
        certificate_coordinates: {
          name: certificateCoordinates.name,
          event_title: certificateCoordinates.eventTitle,
          date: certificateCoordinates.date,
        },
        certificate_sample_text: {
          name: sampleName,
          event_title: sampleEventTitle || eventName,
          date: sampleDate || eventDate,
        },
      }

      // Post to backend API (ensure trailing slash for Django REST Framework)
      const eventsUrl = adminApi.events().endsWith('/') ? adminApi.events() : `${adminApi.events()}/`
      console.log('[Create Event] Posting to:', eventsUrl, payload)
      
      const response = await apiCall.post(eventsUrl, payload)
      
      console.log('[Create Event] Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        let errorMessage = `Failed to create event: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('[Create Event] Error response:', errorData)
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

      const createdEvent = await response.json()
      console.log('[Create Event] Success! Created event:', createdEvent)
      console.log('[Create Event] Event ID:', createdEvent.id)
      console.log('[Create Event] Event title:', createdEvent.title)
      console.log('[Create Event] Full response:', JSON.stringify(createdEvent, null, 2))
      
      setIsLoading(false)
      
      // Redirect to the event detail page using the ID from the API response
      if (createdEvent.id) {
        console.log('[Create Event] Redirecting to event detail page:', `/admin/events/${createdEvent.id}`)
        router.push(`/admin/events/${createdEvent.id}`)
      } else {
        console.warn('[Create Event] No ID in response, redirecting to events list')
        router.push('/admin/events')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Unable to create event right now.')
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex gap-4 flex-wrap">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(step)}
              disabled={step > currentStep + 1}
              className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition-colors ${
                isActive || isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {step}
            </button>
            {step < totalSteps && <div className={`h-1 w-10 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
        <p className="text-muted-foreground">Complete every step to publish your event with a custom certificate.</p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="p-4 rounded-md border border-destructive bg-destructive/10 text-sm text-destructive">
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 1 · Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Event Name *</Label>
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="CROSS BLAZERS CUP" />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe your event..."
                  className="min-h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Speakers</Label>
                <Input value={speakers} onChange={(e) => setSpeakers(e.target.value)} placeholder="John Doe, Jane Smith" />
              </div>
              <div>
                <Label>Event Category</Label>
                <select
                  value={eventCategory}
                  onChange={(e) => {
                    setEventCategory(e.target.value)
                    if (e.target.value === 'outside') {
                      setDepartmentCategory('Outside Event')
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="HCDC">HCDC Wide Event</option>
                  <option value="department">Department Event</option>
                  <option value="outside">Outside Event</option>
                </select>
              </div>
              {eventCategory === 'department' && (
                <div>
                  <Label>College / School</Label>
                  <select
                    value={departmentCategory}
                    onChange={(e) => setDepartmentCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select a college or school</option>
                    {Object.keys(COLLEGES).map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Venue *</Label>
                <div className="flex gap-2">
                  <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="HCDC Gymnasium" />
                  <Button variant="outline" size="icon">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Cover Image</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" id="cover-upload" className="hidden" onChange={handleCoverUpload} />
                  <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center gap-2 text-sm">
                    {coverImage ? (
                      <img src={coverImage} alt="Cover" className="w-full rounded-lg object-cover h-40" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        Upload header image
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button disabled={!isStep1Valid} onClick={() => setCurrentStep(2)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 2 · Event Options</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Limit Capacity</p>
                <p className="text-sm text-muted-foreground">Restrict number of participants</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setHasCapacityLimit(prev => !prev)}
                className={hasCapacityLimit ? 'bg-primary text-primary-foreground' : ''}
              >
                {hasCapacityLimit ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            {hasCapacityLimit && (
              <div>
                <Label>Maximum Capacity</Label>
                <Input type="number" value={capacity} min={1} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Require Approval</p>
                <p className="text-sm text-muted-foreground">Approve registrations manually</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setRequireApproval(prev => !prev)}
                className={requireApproval ? 'bg-primary text-primary-foreground' : ''}
              >
                {requireApproval ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Paid Event</p>
                <p className="text-sm text-muted-foreground">Charge a ticket price</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPaidEvent(prev => !prev)}
                className={isPaidEvent ? 'bg-primary text-primary-foreground' : ''}
              >
                {isPaidEvent ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            {isPaidEvent && (
              <div>
                <Label>Ticket Price (PHP)</Label>
                <Input type="number" min={0} value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Public Event</p>
                <p className="text-sm text-muted-foreground">Visible on Discover page</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsPublic(prev => !prev)}
                className={isPublic ? 'bg-primary text-primary-foreground' : ''}
              >
                {isPublic ? 'Public' : 'Private'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button disabled={!isStep2Valid} onClick={() => setCurrentStep(3)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 3 · Upload Certificate Template</h2>
          <p className="text-sm text-muted-foreground">
            Upload a landscape-oriented certificate template (PNG or JPG). Any size is supported as long as it's wider than it is tall.
          </p>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input type="file" accept="image/png,image/jpeg" id="certificate-upload" className="hidden" onChange={handleCertificateUpload} />
            <label htmlFor="certificate-upload" className="flex flex-col items-center gap-3 cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm">{certificateTemplate ? 'Replace template' : 'Upload certificate template'}</span>
              <span className="text-xs text-muted-foreground">
                {certificateTemplate
                  ? `Detected size: ${certificateSize.width} x ${certificateSize.height} px`
                  : 'Any landscape size is supported; coordinates will match the image size.'}
              </span>
            </label>
          </div>
          {certificateError && <p className="text-sm text-destructive">{certificateError}</p>}
          {certificateTemplate && (
            <img src={certificateTemplate} alt="Certificate template" className="w-full rounded-lg border border-border" />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button disabled={!isCertificateReady} onClick={() => setCurrentStep(4)}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 4 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 4 · Coordinate Mapping</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Drag the text directly on the certificate preview, or fine-tune with the X/Y inputs.
          </p>
          {/* Visual drag-and-drop preview */}
          <div
            ref={certificatePreviewRef}
            className="relative border border-border rounded-lg overflow-hidden bg-muted"
            style={{ paddingBottom: '70%' }}
          >
            {certificateTemplate ? (
              <>
                {/* Template image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificateTemplate}
                  alt="Certificate template"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />
                {/* Draggable text overlays */}
                <div className="absolute inset-0">
                  <span
                    className="absolute text-2xl font-bold text-primary uppercase tracking-wide cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('name', e)}
                  >
                    {sampleName}
                  </span>
                  <span
                    className="absolute text-lg font-semibold text-foreground cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('eventTitle', e)}
                  >
                    {sampleEventTitle || eventName}
                  </span>
                  <span
                    className="absolute text-base text-foreground cursor-move select-none"
                    style={{
                      left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                    onMouseDown={(e) => handleDragStart('date', e)}
                  >
                    {sampleDate || eventDate}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Upload a certificate template in Step 3 to position the text overlays.
              </div>
            )}
          </div>

          {/* Optional fine-tuning inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Participant Name', key: 'name' as const },
              { label: 'Event Title', key: 'eventTitle' as const },
              { label: 'Event Date', key: 'date' as const },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-3 border border-border rounded-lg p-4">
                <p className="font-semibold text-sm">{label}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">X</Label>
                    <Input
                      type="number"
                      value={certificateCoordinates[key].x}
                      onChange={(e) => handleCoordinateChange(key, 'x', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Y</Label>
                    <Input
                      type="number"
                      value={certificateCoordinates[key].y}
                      onChange={(e) => handleCoordinateChange(key, 'y', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Sample Name</Label>
              <Input value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
            </div>
            <div>
              <Label>Sample Event Title</Label>
              <Input value={sampleEventTitle} onChange={(e) => setSampleEventTitle(e.target.value)} />
            </div>
            <div>
              <Label>Sample Date</Label>
              <Input value={sampleDate} onChange={(e) => setSampleDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(5)}>Continue</Button>
          </div>
        </Card>
      )}

      {currentStep === 5 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 5 · Event Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Event Name</p>
                <p className="font-semibold text-foreground">{eventName || 'Event Name'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Venue</p>
                <p className="font-semibold text-foreground">{venue || 'Venue'}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date & Time</p>
                <p className="font-semibold text-foreground">
                  {eventDate || 'Date'} • {startTime || '00:00'} - {endTime || '00:00'}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capacity</p>
                <p className="font-semibold text-foreground">
                  {hasCapacityLimit ? `${capacity} seats` : 'Unlimited'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Live Preview</p>
              <div className={`${activeTheme.color} rounded-lg overflow-hidden text-white shadow-lg`}>
                {coverImage && <img src={coverImage} alt="Cover" className="w-full h-40 object-cover" />}
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-xl">{eventName || 'Your Event Title'}</h3>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{eventDate || 'Select a date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    <span>
                      {startTime || '--:--'} - {endTime || '--:--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <MapPin className="w-4 h-4" />
                    <span>{venue || 'Venue'}</span>
                  </div>
                  {hasCapacityLimit && (
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Users className="w-4 h-4" />
                      <span>Max {capacity} participants</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(4)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(6)}>Continue</Button>
          </div>
        </Card>
      )}

      {currentStep === 6 && (
        <Card className="p-8 border border-border bg-card space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Step 6 · Certificate Preview & Create</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Make sure the overlays look correct before publishing.
          </p>
          <div className="relative border border-border rounded-lg overflow-hidden" style={{ paddingBottom: '70%' }}>
            {certificateTemplate ? (
              <>
                <img src={certificateTemplate} alt="Certificate template" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <span
                    className="absolute text-2xl font-bold text-primary uppercase tracking-wide"
                    style={{
                      left: `${(certificateCoordinates.name.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.name.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleName}
                  </span>
                  <span
                    className="absolute text-lg font-semibold text-foreground"
                    style={{
                      left: `${(certificateCoordinates.eventTitle.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.eventTitle.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleEventTitle || eventName}
                  </span>
                  <span
                    className="absolute text-base text-foreground"
                    style={{
                      left: `${(certificateCoordinates.date.x / certificateSize.width) * 100}%`,
                      bottom: `${(certificateCoordinates.date.y / certificateSize.height) * 100}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    {sampleDate || eventDate}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Upload a certificate template to preview.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>• Certificates are stored as base64 in Django</span>
            <span>• pinay.py watermark is applied automatically</span>
            <span>• Coordinates are required for name, title, and date</span>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCurrentStep(5)} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleCreateEvent} disabled={isLoading || !certificateTemplate}>
              {isLoading ? 'Creating event...' : 'Create Event'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

