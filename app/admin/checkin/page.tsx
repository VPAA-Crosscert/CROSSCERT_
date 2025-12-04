'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall } from '@/lib/api-config'
import jsQR from 'jsqr'

type EventRecord = {
  id: number
  title?: string
  name?: string
  status?: string
}

export default function AdminCheckIn() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [events, setEvents] = useState<EventRecord[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastAction, setLastAction] = useState<'check-in' | 'check-out' | null>(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true)
      setEventsError('')
      try {
        // Prefer localStorage events to avoid backend calls during local development
        // This matches the behavior of the Events page
        const existing = localStorage.getItem('crosscert_local_events')
        if (existing) {
          try {
            const list = JSON.parse(existing) as EventRecord[]
            const validEvents = (Array.isArray(list) ? list : [])
              .filter((evt) => evt && evt.id)
              .map((evt) => ({
                id: evt.id,
                title: evt.title || evt.name || `Event #${evt.id}`,
              }))
            setEvents(validEvents)
            setEventsLoading(false)
            return
          } catch (parseErr) {
            // Continue to API fetch if localStorage parse fails
          }
        }

        // Fallback: attempt to fetch from API if no local events found
        const res = await apiCall.get(api.events())
        if (!res.ok) {
          if (res.status === 403) {
            setEventsError('Access denied. Please ensure you are logged in as an admin.')
          } else {
            setEventsError('Unable to load events. Please try again.')
          }
          setEvents([])
          return
        }
        const data = await res.json()
        
        // Ensure events is an array (handle paginated responses or other formats)
        const events: EventRecord[] = Array.isArray(data) 
          ? data 
          : (data.results || data.data || [])

        // Validate each event - handle both 'title' and 'name' properties, and keep status
        const validEvents = events
          .filter((evt) => evt && evt.id)
          .map((evt) => ({
            id: evt.id,
            title: evt.title || evt.name || `Event #${evt.id}`,
            status: evt.status,
          }))
        
        setEvents(validEvents)
        if (validEvents.length === 0 && events.length > 0) {
          setEventsError('Events loaded but none are valid.')
        }
      } catch (err: any) {
        setEventsError(err.message || 'Unable to load events. Please check your connection.')
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const handleAutoScan = useCallback(async (code: string) => {
    if (!selectedEvent) {
      alert('Please select an event first')
      setTimeout(() => setIsProcessingScan(false), 1000)
      return
    }

    if (!code.trim()) {
      setTimeout(() => setIsProcessingScan(false), 500)
      return
    }

    try {
      const res = await apiCall.post(`${api.checkIns()}check-in-by-code/`, {
        code: code.trim(),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || data.message || 'Unable to check in participant.')
        setTimeout(() => setIsProcessingScan(false), 2000)
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      setCheckedInCount(prev => prev + 1)
      setShowSuccess(true)
      setLastAction('check-in')

      // Reset after showing success
      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
        setIsProcessingScan(false)
      }, 2000)
    } catch (err) {
      alert('Network error while checking in participant.')
      setTimeout(() => setIsProcessingScan(false), 2000)
    }
  }, [selectedEvent])

  // Apply stream to video element after it's rendered and start QR scanning
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current
      const stream = streamRef.current
      
      video.srcObject = stream

      // Ensure video plays
      video.onloadedmetadata = () => {
        if (video) {
          video.play().catch(() => {
            // Silently handle play errors
          })
        }
      }

      // Start automatic QR code scanning
      if (canvasRef.current && video) {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d', { willReadFrequently: true })
        
        if (context) {
          // Set canvas size to match video
          const updateCanvasSize = () => {
            if (video.videoWidth && video.videoHeight) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
            }
          }

          // Update canvas size when video metadata loads
          video.addEventListener('loadedmetadata', updateCanvasSize)
          video.addEventListener('resize', updateCanvasSize)
          updateCanvasSize()

          // Wait a bit for video to be ready before starting scan
          const startScanning = setTimeout(() => {
            // Scan for QR codes every 200ms
            scanIntervalRef.current = setInterval(() => {
              const isReady = video.readyState === video.HAVE_ENOUGH_DATA
              const hasValidSize = canvas.width > 0 && canvas.height > 0
              const notProcessing = !isProcessingScan

              if (isReady && notProcessing && hasValidSize) {
                try {
                  // Draw video frame to canvas
                  context.drawImage(video, 0, 0, canvas.width, canvas.height)
                  
                  // Get image data
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                  
                  // Use jsQR to decode QR code
                  try {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: 'dontInvert'
                    })
                    
                    if (code && code.data) {
                      // QR code detected - automatically process it
                      setIsProcessingScan(true)
                      setScannedCode(code.data)
                      // Automatically trigger check-in
                      handleAutoScan(code.data)
                    }
                  } catch (qrErr) {
                    // QR decoding failed (no QR code found is normal)
                  }
                } catch (err) {
                  // Silently handle scanning errors
                }
              }
            }, 200)
          }, 500) // Wait 500ms for video to initialize

          return () => {
            clearTimeout(startScanning)
          }
        }
      }
    }

    // Cleanup: stop scanning when camera is deactivated
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [cameraActive, isProcessingScan, handleAutoScan])

  const startCamera = async () => {
    // Check if browser supports camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.')
      return
    }

    // Check if we're on HTTPS or localhost (required for camera access)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (!isSecure) {
      alert('Camera access requires HTTPS. Please access this page over HTTPS or use localhost.')
      return
    }

    try {
      // Try to get back camera first (for QR scanning)
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
      } catch (backCameraError) {
        // If back camera fails, try any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
      }

      if (stream) {
        // Store stream in ref so we can apply it after video element renders
        streamRef.current = stream

        // Set cameraActive to true first - this will render the video element
        // Then useEffect will apply the stream to the video element
        setCameraActive(true)
      }
    } catch (err: any) {
      let errorMessage = 'Unable to access camera. '
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on your device.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the required settings.'
      } else {
        errorMessage += 'Please check your camera permissions and try again.'
      }
      
      alert(errorMessage + '\n\nYou can still use manual code entry below.')
    }
  }

  const stopCamera = () => {
    // Stop scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    // Stop all tracks from the stream ref
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setIsProcessingScan(false)
  }


  const handleScan = async () => {
    if (!selectedEvent) {
      alert('Please select an event first')
      return
    }

    if (!scannedCode.trim()) {
      alert('Please enter a code or scan a QR code')
      return
    }

    try {
      const res = await apiCall.post(`${api.checkIns()}check-in-by-code/`, {
        code: scannedCode.trim(),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || data.message || 'Unable to check in participant.')
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      setCheckedInCount(prev => prev + 1)
      setShowSuccess(true)
      setLastAction('check-in')

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
      }, 2000)
    } catch (err) {
      alert('Network error while checking in participant.')
    }
  }

  const handleCheckOut = async () => {
    if (!selectedEvent) {
      alert('Please select an event first')
      return
    }

    // Only allow check-out when event is completed
    const event = events.find(e => e.id.toString() === selectedEvent)
    const normalizedStatus = (event?.status || '').toLowerCase()
    if (normalizedStatus !== 'completed') {
      alert('You can only check out participants after the event has been concluded.')
      return
    }

    if (!scannedCode.trim()) {
      alert('Please enter a code or scan a QR code')
      return
    }

    try {
      const res = await apiCall.post(`${api.checkIns()}check-out-by-code/`, {
        code: scannedCode.trim(),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || data.message || 'Unable to check out participant.')
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      setShowSuccess(true)
      setLastAction('check-out')

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
      }, 2000)
    } catch (err) {
      alert('Network error while checking out participant.')
    }
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
        <h1 className="text-3xl font-bold text-foreground">Event Check-In</h1>
        <p className="text-muted-foreground mt-1">Select an event and scan participant QR codes or barcodes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-border bg-card space-y-4">
            <div>
              <Label className="text-foreground font-semibold">Select Event</Label>
              {eventsError && (
                <p className="text-sm text-destructive mt-1 mb-2">{eventsError}</p>
              )}
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full mt-2 px-3 py-2 rounded-md border border-border bg-background text-foreground"
                disabled={eventsLoading}
              >
                <option value="">
                  {eventsLoading 
                    ? 'Loading events...' 
                    : events.length === 0 
                    ? 'No events available' 
                    : '-- Choose an event --'}
                </option>
                {Array.isArray(events) && events.map((event) => (
                  <option key={event.id} value={event.id.toString()}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="p-6 border border-border bg-card space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-secondary" />
              <h2 className="text-xl font-semibold text-foreground">QR Code Scanner</h2>
            </div>

            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative w-full bg-black rounded-lg overflow-hidden border border-border" style={{ minHeight: '300px', maxHeight: '500px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                    style={{ 
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxHeight: '500px'
                    }}
                  />
                  {/* Scanning overlay indicator */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="border-2 border-green-500 rounded-lg" style={{ 
                      width: '250px', 
                      height: '250px',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}>
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={stopCamera}
                  >
                    Stop Camera
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Position the QR code within the frame. Scanning automatically...
                </p>
                {isProcessingScan && (
                  <p className="text-sm text-blue-500 text-center animate-pulse">
                    Processing QR code...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full bg-muted rounded-lg border border-border flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <div className="text-center space-y-2">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Camera not active</p>
                  </div>
                </div>
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                <QrCode className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input
                placeholder="Or paste scanned code here..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="pl-10 bg-background border-border text-base"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
                size="lg"
                onClick={handleScan}
              >
                Check In Participant
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold"
                size="lg"
                onClick={handleCheckOut}
              >
                Check Out Participant
              </Button>
            </div>
          </Card>

          {/* Success Feedback */}
          {showSuccess && (
            <Card className="p-6 border-2 border-green-500 bg-green-50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-green-900">{participantName}</p>
                  <p className="text-sm text-green-700">
                    {lastAction === 'check-out' ? 'Successfully checked out' : 'Successfully checked in'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="p-6 border border-border bg-card sticky top-20 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold text-foreground">Today's Stats</h3>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-4xl font-bold text-secondary">{checkedInCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Checked In</p>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground mt-1">Total Expected</p>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-purple-500">
                  {Math.round((checkedInCount / 12) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Attendance Rate</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
