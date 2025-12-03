'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, QrCode, BarChart3, Camera } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, apiCall } from '@/lib/api-config'

type EventRecord = {
  id: number
  title: string
}

export default function AdminCheckIn() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [events, setEvents] = useState<EventRecord[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiCall.get(api.events())
        if (!res.ok) throw new Error('Unable to load events')
        const data = await res.json()
        setEvents(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchEvents()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      alert('Unable to access camera. Using manual entry instead.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL('image/png')
        console.log('[v0] QR code captured, would be processed here')
      }
    }
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
      const res = await fetch(`${api.checkIns()}/check-in-by-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scannedCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || data.message || 'Unable to check in participant.')
        return
      }

      setParticipantName(`${data.participant_name ?? 'Participant'}`)
      setCheckedInCount(prev => prev + 1)
      setShowSuccess(true)

      setTimeout(() => {
        setScannedCode('')
        setShowSuccess(false)
      }, 2000)
    } catch (err) {
      alert('Network error while checking in participant.')
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
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full mt-2 px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="">-- Choose an event --</option>
                {events.map((event) => (
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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border border-border"
                  style={{ maxHeight: '300px' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={captureFrame}
                  >
                    Capture
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={stopCamera}
                  >
                    Stop Camera
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                onClick={startCamera}
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
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

            <Button
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
              size="lg"
              onClick={handleScan}
            >
              Check In Participant
            </Button>
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
                  <p className="text-sm text-green-700">Successfully checked in</p>
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
