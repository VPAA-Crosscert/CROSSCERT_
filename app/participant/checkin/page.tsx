'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, QrCode, Barcode } from 'lucide-react'

export default function CheckIn() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [scanMode, setScanMode] = useState<'qr' | 'barcode'>('qr')

  const handleCheckIn = () => {
    if (code.trim()) {
      console.log('Checking in with code:', code)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-foreground">Event Check-In</h1>
        <p className="text-muted-foreground mt-1">Scan your QR code to check in</p>
      </div>

      {/* Scanner Area */}
      <Card className="p-8 border border-border bg-card space-y-6">
        <div className="bg-muted p-8 rounded-lg border-2 border-dashed border-border h-64 flex items-center justify-center">
          <div className="text-center">
            <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Position QR code in front of camera</p>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Or enter code manually</label>
          <Input
            placeholder="Enter check-in code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        <Button
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          size="lg"
          onClick={handleCheckIn}
        >
          Check In
        </Button>
      </Card>
    </div>
  )
}
