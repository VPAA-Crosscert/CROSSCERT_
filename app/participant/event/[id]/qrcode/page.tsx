'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, X, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, apiCall, getAuthenticatedUserEmail, authApi, apiRequest } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

type RegistrationPayload = {
  id: number
  first_name: string
  last_name: string
  email: string
  qr_code: string | null
  qr_code_value: string | null
}

export default function ParticipantQRCode() {
  const router = useRouter()
  const params = useParams()
  const [showModal, setShowModal] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registration, setRegistration] = useState<RegistrationPayload | null>(null)
  const [userProfile, setUserProfile] = useState<{ department?: string; program?: string } | null>(null)

  useEffect(() => {
    const fetchRegistration = async () => {
      const eventId = params.id as string
      
      // Get authenticated user's email from API session (not localStorage)
      const email = await getAuthenticatedUserEmail()
      if (!email) {
        setError('You must be signed in to view your QR code.')
        setLoading(false)
        return
      }
      
      console.log('[QR Code] Authenticated user email:', email)
      
      // Fetch user profile for department/program
      try {
        const profileResponse = await apiRequest(authApi.me(), { method: 'GET' })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.authenticated && profileData.user) {
            setUserProfile({
              department: profileData.user.department || '',
              program: profileData.user.program || '',
            })
          }
        }
      } catch (err) {
        console.warn('[QR Code] Could not fetch user profile:', err)
      }

      try {
        // api.registrations() already ends with /, so we use ? not /?
        const baseUrl = api.registrations().endsWith('/') 
          ? api.registrations().slice(0, -1) 
          : api.registrations()
        const url = `${baseUrl}/?event=${encodeURIComponent(eventId)}&email=${encodeURIComponent(email)}`
        console.log('[QR Code] Fetching registration from:', url)
        const res = await apiCall.get(url)
        if (!res.ok) throw new Error('Unable to load registration data.')
        const data = await res.json()
        
        // Handle paginated response
        const registrations = Array.isArray(data) 
          ? data 
          : (data.results || data.data || [])
        
        if (registrations.length === 0) {
          setError('No registration found for this event.')
        } else {
          setRegistration(registrations[0])
        }
      } catch (err: any) {
        setError(err.message ?? 'Unable to load your QR code.')
      } finally {
        setLoading(false)
      }
    }

    fetchRegistration()
  }, [params.id])

  const handleCloseModal = () => {
    setShowModal(false)
    router.push(`/participant/event/${params.id}`)
  }

  const handleDownload = () => {
    // For now just close; future: export QR/barcode as image.
    handleCloseModal()
  }

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card w-full max-w-5xl mx-4">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">Your Check-In Codes</h1>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg border border-border space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {registration ? `${registration.first_name} ${registration.last_name}` : 'Participant'}
                </h2>
                <p className="text-sm text-muted-foreground">{registration?.email}</p>
                <div className="h-px bg-border" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">
                    {userProfile?.department || 'Not set'}
                  </p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium text-foreground">
                    {userProfile?.program || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg border border-border flex items-center justify-center">
                <div className="aspect-square w-full max-w-56 bg-white rounded flex items-center justify-center p-2">
                  {registration?.qr_code ? (
                    // Use backend-generated QR code if available
                    <img
                      src={`data:image/png;base64,${registration.qr_code}`}
                      alt="QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  ) : registration?.qr_code_value ? (
                    // Generate QR code on frontend using qr_code_value
                    <QRCodeSVG
                      value={registration.qr_code_value}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    // Fallback: generate QR code using registration ID and email
                    <QRCodeSVG
                      value={`REG-${params.id}-${registration?.email || ''}`}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg border border-border text-center flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground mb-2">Registration Code</p>
                <p className="font-mono text-lg font-bold text-foreground break-all">
                  {registration?.qr_code_value ?? '—'}
                </p>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseModal}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-muted-foreground">Loading your QR code...</p>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-destructive">{error}</p>
        </Card>
      )}
    </div>
  )
}
