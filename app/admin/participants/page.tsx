'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall } from '@/lib/api-config'
import { QRCodeSVG } from 'qrcode.react'

type EventRecord = {
  id: number
  title: string
}

type RegistrationRecord = {
  id: number
  event: number
  email: string
  first_name: string
  last_name: string
  qr_code?: string | null
  qr_code_value?: string | null
  registered_at?: string
  is_present?: boolean
  has_evaluated?: boolean
}

export default function AdminParticipants() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<
    { 
      id: number
      name: string
      email: string
      eventName: string
      qr_code?: string | null
      qr_code_value?: string | null
      registered_at?: string
      is_present?: boolean
      has_evaluated?: boolean
    }[]
  >([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedParticipant, setSelectedParticipant] = useState<typeof participants[0] | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          apiCall.get(api.events()),
          apiCall.get(api.registrations()),
        ])

        if (!eventsRes.ok || !regsRes.ok) {
          if (eventsRes.status === 403 || regsRes.status === 403) {
            throw new Error('Access denied. Please ensure you are logged in as an admin.')
          }
          throw new Error('Unable to load participants data.')
        }

        const eventsData = await eventsRes.json()
        const registrationsData = await regsRes.json()

        // Ensure events is an array (handle paginated responses or other formats)
        const events: EventRecord[] = Array.isArray(eventsData) 
          ? eventsData 
          : (eventsData.results || eventsData.data || [])

        // Ensure registrations is an array
        const registrations: RegistrationRecord[] = Array.isArray(registrationsData)
          ? registrationsData
          : (registrationsData.results || registrationsData.data || [])

        const eventMap = new Map<number, string>()
        if (Array.isArray(events)) {
          events.forEach((evt) => {
            if (evt && evt.id && evt.title) {
              eventMap.set(evt.id, evt.title)
            }
          })
        }

        const flat = Array.isArray(registrations) 
          ? registrations.map((reg) => ({
              id: reg.id,
              name: `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Unknown',
              email: reg.email || 'No email',
              eventName: eventMap.get(reg.event) || `Event #${reg.event}`,
              qr_code: reg.qr_code || null,
              qr_code_value: reg.qr_code_value || null,
              registered_at: reg.registered_at,
              is_present: reg.is_present,
              has_evaluated: reg.has_evaluated,
            }))
          : []

        setParticipants(flat)
      } catch (err: any) {
        setError(err.message || 'Unable to load participants.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredParticipants = participants.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold text-foreground">Participants</h1>
        <p className="text-muted-foreground mt-1">Manage all event participants</p>
      </div>

      {error && (
        <Card className="p-4 border border-destructive bg-destructive/10 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="p-4 border border-border bg-card">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-0"
          />
        </div>
      </Card>

      {/* Participants Table */}
      <Card className="border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Event</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">QR Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Loading participants...
                </td>
              </tr>
            ) : filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-foreground">{participant.name}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{participant.email}</td>
                  <td className="px-6 py-3 text-sm text-foreground">{participant.eventName}</td>
                  <td className="px-6 py-3 text-sm">
                    {(participant.qr_code || participant.qr_code_value) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedParticipant(participant)}
                      >
                        View QR
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">No QR</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Registered</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {participant.is_present && !participant.has_evaluated && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Checked In
                          </span>
                        )}
                        {participant.has_evaluated && (
                          <>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Checked Out
                            </span>
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                              Evaluated
                            </span>
                          </>
                        )}
                        {!participant.is_present && !participant.has_evaluated && (
                          <span className="text-xs text-muted-foreground">
                            Not yet checked in
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No participants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* QR Code Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 border border-border bg-card w-full max-w-2xl mx-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {selectedParticipant.name}
                  </h2>
                  <p className="text-muted-foreground">{selectedParticipant.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Event: {selectedParticipant.eventName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedParticipant(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {(selectedParticipant.qr_code || selectedParticipant.qr_code_value) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg border border-border text-center">
                    <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                    <div className="flex justify-center bg-white rounded p-2">
                      {selectedParticipant.qr_code ? (
                        // Use backend-generated QR code if available
                        <img
                          src={`data:image/png;base64,${selectedParticipant.qr_code}`}
                          alt="QR Code"
                          className="w-32 h-32 object-contain"
                        />
                      ) : selectedParticipant.qr_code_value ? (
                        // Generate QR code on frontend using qr_code_value
                        <QRCodeSVG
                          value={selectedParticipant.qr_code_value}
                          size={128}
                          level="H"
                          includeMargin={true}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">No QR code available</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg border border-border text-center flex flex-col items-center justify-center">
                    <p className="text-xs text-muted-foreground mb-2">Registration Code</p>
                    <p className="font-mono text-lg font-bold text-foreground break-all">
                      {selectedParticipant.qr_code_value || '—'}
                    </p>
                    {selectedParticipant.registered_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Registered: {new Date(selectedParticipant.registered_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">No QR code available for this participant</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedParticipant(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
