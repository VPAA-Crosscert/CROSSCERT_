'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function CheckInPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(true)
  const [scannedCode, setScannedCode] = useState('')
  const [checkInStatus, setCheckInStatus] = useState<'scanning' | 'success' | 'error' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // TODO: Integrate actual QR code scanner here
    // For now, simulate QR code scanning with keyboard input
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && scannedCode.trim()) {
        handleCheckIn(scannedCode)
      } else if (e.key !== 'Backspace') {
        setScannedCode(prev => prev + e.key)
      }
    }

    if (isScanning) {
      window.addEventListener('keydown', handleKeyPress)
    }

    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isScanning, scannedCode])

  const handleCheckIn = async (code: string) => {
    setIsScanning(false)
    setCheckInStatus('scanning')
    
    // TODO: Connect to Django backend for check-in
    setTimeout(() => {
      if (code.length > 0) {
        setCheckInStatus('success')
        setMessage(`Welcome! You've been checked in to Advanced Python Workshop`)
        setTimeout(() => {
          setScannedCode('')
          setCheckInStatus(null)
          setMessage('')
          setIsScanning(true)
        }, 3000)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Check In</h1>
          <p className="text-muted-foreground">Point camera at QR code or tap to scan</p>
        </div>

        {/* Scanner */}
        {checkInStatus === null && (
          <Card className="aspect-square border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-card/50 backdrop-blur">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-lg border-4 border-primary/30 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-primary rounded animate-pulse"></div>
              </div>
              <p className="text-muted-foreground">Ready to scan</p>
            </div>
          </Card>
        )}

        {/* Scanning State */}
        {checkInStatus === 'scanning' && (
          <Card className="aspect-square border-2 border-primary rounded-2xl flex items-center justify-center bg-card">
            <div className="text-center space-y-4">
              <Loader className="w-12 h-12 text-primary mx-auto animate-spin" />
              <p className="text-foreground">Processing check-in...</p>
            </div>
          </Card>
        )}

        {/* Success State */}
        {checkInStatus === 'success' && (
          <Card className="aspect-square border-2 border-accent rounded-2xl flex items-center justify-center bg-accent/10">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-accent mx-auto" />
              <p className="text-foreground font-semibold">{message}</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {checkInStatus === 'error' && (
          <Card className="aspect-square border-2 border-destructive rounded-2xl flex items-center justify-center bg-destructive/10">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <p className="text-foreground">{message}</p>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
            onClick={() => handleCheckIn('QR_' + Math.random())}
          >
            Start Scanning
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => router.push('/my-events')}
          >
            Go to My Events
          </Button>
        </div>

        {/* Info */}
        <Card className="p-4 border border-border bg-card/50">
          <p className="text-sm text-muted-foreground">
            Scan your event QR code to check in. You'll need to complete the evaluation after the event to receive your certificate.
          </p>
        </Card>
      </div>
    </div>
  )
}
