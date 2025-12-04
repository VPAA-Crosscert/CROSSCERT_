'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Download, Mail, CheckCircle, Filter, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, apiCall, adminApi } from '@/lib/api-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CertificateRecord = {
  id: number
  registration: number
  certificate_file?: string | null
  issued_at: string
  is_emailed: boolean
  email_sent_at?: string | null
  participant_name?: string
  participant_email?: string
  event_title?: string
  event_id?: number
}

type EventRecord = {
  id: number
  title: string
  status: string
}

export default function AdminCertificates() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events and certificates
        const [eventsRes, certificatesRes] = await Promise.all([
          apiCall.get(adminApi.events()),
          apiCall.get(adminApi.certificates()),
        ])

        if (!eventsRes.ok || !certificatesRes.ok) {
          throw new Error('Unable to load certificates data.')
        }

        const eventsData = await eventsRes.json()
        const certificatesData = await certificatesRes.json()

        // Handle paginated responses
        const eventsList: EventRecord[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.results || eventsData.data || [])
        
        const certificatesList: CertificateRecord[] = Array.isArray(certificatesData)
          ? certificatesData
          : (certificatesData.results || certificatesData.data || [])

        // Fetch registration details for each certificate to get participant info
        const enrichedCertificates = await Promise.all(
          certificatesList.map(async (cert) => {
            try {
              const regRes = await apiCall.get(`${api.registrations()}/${cert.registration}/`)
              if (regRes.ok) {
                const reg = await regRes.json()
                // Fetch event details
                const eventRes = await apiCall.get(api.eventById(reg.event))
                if (eventRes.ok) {
                  const event = await eventRes.json()
                  return {
                    ...cert,
                    event_title: event.title,
                    event_id: event.id,
                    participant_name: `${reg.first_name} ${reg.last_name}`,
                    participant_email: reg.email,
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch details for certificate ${cert.id}:`, err)
            }
            return cert
          })
        )

        setEvents(eventsList)
        setCertificates(enrichedCertificates)
      } catch (err: any) {
        setError(err.message || 'Unable to load certificates.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = 
      cert.participant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.participant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.event_title?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEvent = selectedEvent === 'all' || String(cert.event_id) === selectedEvent
    // Status is based on certificate_file and is_emailed
    const certStatus = cert.certificate_file 
      ? (cert.is_emailed ? 'sent' : 'generated')
      : 'pending'
    const matchesStatus = selectedStatus === 'all' || certStatus === selectedStatus
    
    return matchesSearch && matchesEvent && matchesStatus
  })

  const handleGenerateCertificate = async (certId: number) => {
    setProcessingIds(prev => new Set(prev).add(certId))
    try {
      // The backend expects registration ID, not certificate ID
      const cert = certificates.find(c => c.id === certId)
      if (!cert) {
        throw new Error('Certificate not found')
      }
      
      const response = await apiCall.post(`${adminApi.certificates()}${cert.registration}/generate_certificate/`, {})
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate certificate')
      }
      
      // Refresh certificates
      const certsRes = await apiCall.get(adminApi.certificates())
      if (certsRes.ok) {
        const certsData = await certsRes.json()
        const certsList: CertificateRecord[] = Array.isArray(certsData)
          ? certsData
          : (certsData.results || certsData.data || [])
        
        // Enrich with participant info
        const enrichedCerts = await Promise.all(
          certsList.map(async (c) => {
            try {
              const regRes = await apiCall.get(`${api.registrations()}/${c.registration}/`)
              if (regRes.ok) {
                const reg = await regRes.json()
                const eventRes = await apiCall.get(api.eventById(reg.event))
                if (eventRes.ok) {
                  const event = await eventRes.json()
                  return {
                    ...c,
                    event_title: event.title,
                    event_id: event.id,
                    participant_name: `${reg.first_name} ${reg.last_name}`,
                    participant_email: reg.email,
                  }
                }
              }
            } catch (err) {
              console.warn(`Could not fetch details for certificate ${c.id}:`, err)
            }
            return c
          })
        )
        setCertificates(enrichedCerts)
      }
      
      alert('Certificate generated successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to generate certificate')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(certId)
        return newSet
      })
    }
  }

  const handleSendEmail = async (certId: number) => {
    setProcessingIds(prev => new Set(prev).add(certId))
    try {
      const response = await apiCall.post(`${adminApi.certificates()}${certId}/send_email/`, {})
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send email')
      }
      
      // Refresh certificates
      const certsRes = await apiCall.get(adminApi.certificates())
      if (certsRes.ok) {
        const certsData = await certsRes.json()
        const certsList: CertificateRecord[] = Array.isArray(certsData)
          ? certsData
          : (certsData.results || certsData.data || [])
        setCertificates(certsList)
      }
      
      alert('Certificate email sent successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to send email')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(certId)
        return newSet
      })
    }
  }

  const handleDownloadCertificate = async (cert: CertificateRecord) => {
    if (!cert.certificate_file) {
      alert('Certificate file not available. Please generate it first.')
      return
    }
    
    try {
      // Fetch the certificate file from the backend
      const fileUrl = cert.certificate_file.startsWith('http') 
        ? cert.certificate_file 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.certificate_file}`
      
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${cert.id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download certificate')
    }
  }

  // Group by event
  const certificatesByEvent = filteredCertificates.reduce((acc, cert) => {
    const eventId = cert.event_id || 'unknown'
    if (!acc[eventId]) {
      acc[eventId] = []
    }
    acc[eventId].push(cert)
    return acc
  }, {} as Record<string, CertificateRecord[]>)

  const getCertificateStatus = (cert: CertificateRecord): 'pending' | 'generated' | 'sent' => {
    if (cert.certificate_file) {
      return cert.is_emailed ? 'sent' : 'generated'
    }
    return 'pending'
  }

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-50',
    generated: 'text-blue-600 bg-blue-50',
    sent: 'text-green-600 bg-green-50',
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
        <h1 className="text-3xl font-bold text-foreground">Certificate Management</h1>
        <p className="text-muted-foreground mt-1">Generate, preview, and send certificates to participants</p>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-border bg-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, event, or certificate number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.title}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="generated">Generated</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Certificates</p>
          <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
        </Card>
        <Card className="p-4 border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Generated</p>
          <p className="text-2xl font-bold text-blue-600">
            {certificates.filter(c => getCertificateStatus(c) === 'generated' || getCertificateStatus(c) === 'sent').length}
          </p>
        </Card>
        <Card className="p-4 border border-border bg-card">
          <p className="text-sm text-muted-foreground mb-1">Sent</p>
          <p className="text-2xl font-bold text-green-600">
            {certificates.filter(c => getCertificateStatus(c) === 'sent').length}
          </p>
        </Card>
      </div>

      {/* Certificates List */}
      {loading ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-muted-foreground">Loading certificates...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-destructive">{error}</p>
        </Card>
      ) : filteredCertificates.length === 0 ? (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-muted-foreground">No certificates found</p>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Certificates ({filteredCertificates.length})</TabsTrigger>
            <TabsTrigger value="by-event">By Event</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredCertificates.map((cert) => (
              <Card key={cert.id} className="p-4 border border-border bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {cert.participant_name || 'Unknown Participant'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[getCertificateStatus(cert)] || 'text-gray-600 bg-gray-50'}`}>
                        {getCertificateStatus(cert).charAt(0).toUpperCase() + getCertificateStatus(cert).slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{cert.participant_email}</p>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Event: {cert.event_title || 'Unknown Event'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {new Date(cert.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {getCertificateStatus(cert) === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateCertificate(cert.id)}
                        disabled={processingIds.has(cert.id)}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {processingIds.has(cert.id) ? 'Generating...' : 'Generate'}
                      </Button>
                    )}
                    {getCertificateStatus(cert) === 'generated' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCertificate(cert)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                          onClick={() => handleSendEmail(cert.id)}
                          disabled={processingIds.has(cert.id)}
                        >
                          <Mail className="w-4 h-4" />
                          {processingIds.has(cert.id) ? 'Sending...' : 'Send Email'}
                        </Button>
                      </>
                    )}
                    {getCertificateStatus(cert) === 'sent' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadCertificate(cert)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Sent</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="by-event" className="space-y-6">
            {Object.entries(certificatesByEvent).map(([eventId, certs]) => {
              const event = events.find(e => String(e.id) === eventId)
              return (
                <div key={eventId} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {event?.title || `Event ${eventId}`} ({certs.length} certificates)
                  </h3>
                  {certs.map((cert) => (
                    <Card key={cert.id} className="p-4 border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {cert.participant_name || 'Unknown Participant'}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[getCertificateStatus(cert)] || 'text-gray-600 bg-gray-50'}`}>
                              {getCertificateStatus(cert).charAt(0).toUpperCase() + getCertificateStatus(cert).slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{cert.participant_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getCertificateStatus(cert) === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateCertificate(cert.id)}
                              disabled={processingIds.has(cert.id)}
                            >
                              {processingIds.has(cert.id) ? 'Generating...' : 'Generate'}
                            </Button>
                          )}
                          {getCertificateStatus(cert) === 'generated' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadCertificate(cert)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleSendEmail(cert.id)}
                                disabled={processingIds.has(cert.id)}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {getCertificateStatus(cert) === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(cert)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

