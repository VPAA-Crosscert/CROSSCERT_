'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Eye, FileText, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiCall, api, getAuthenticatedUserEmail } from '@/lib/api-config'

type CertificateRecord = {
  id: number
  registration: number
  certificate_number: string
  issue_date: string
  status: 'pending' | 'generated' | 'sent'
  pdf_file?: string | null
  pdf_base64?: string | null
  event_title?: string
  participant_email?: string
}

export default function Certificates() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // Verify user is authenticated
        const userEmail = await getAuthenticatedUserEmail()
        if (!userEmail) {
          setError('Please sign in to view your certificates.')
          setLoading(false)
          return
        }

        // Fetch certificates - backend automatically filters by authenticated user's email
        const response = await apiCall.get(api.certificates())
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please sign in to view your certificates.')
          } else {
            setError('Unable to load certificates. Please try again later.')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        
        // Handle paginated or array responses
        const certificatesList: CertificateRecord[] = Array.isArray(data)
          ? data
          : (data.results || data.data || [])

        // Enrich certificates with event details if needed
        const enrichedCertificates = await Promise.all(
          certificatesList.map(async (cert) => {
            // If event_title is not included, fetch it from registration
            if (!cert.event_title) {
              try {
                const regResponse = await apiCall.get(`${api.registrations()}/${cert.registration}/`)
                if (regResponse.ok) {
                  const reg = await regResponse.json()
                  const eventResponse = await apiCall.get(api.eventById(reg.event))
                  if (eventResponse.ok) {
                    const event = await eventResponse.json()
                    return {
                      ...cert,
                      event_title: event.title,
                    }
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch event details for certificate ${cert.id}:`, err)
              }
            }
            return cert
          })
        )

        setCertificates(enrichedCertificates)
      } catch (err: any) {
        console.error('[Certificates] Error fetching certificates:', err)
        setError(err.message || 'Failed to load certificates. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  const handleViewCertificate = async (cert: CertificateRecord) => {
    if (!cert.pdf_file) {
      alert('Certificate file is not available yet. Please contact the administrator.')
      return
    }

    try {
      // Construct the full URL for the certificate file
      const fileUrl = cert.pdf_file.startsWith('http')
        ? cert.pdf_file
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.pdf_file}`
      
      // Open in new tab
      window.open(fileUrl, '_blank')
    } catch (err: any) {
      alert(err.message || 'Failed to open certificate.')
    }
  }

  const handleDownloadCertificate = async (cert: CertificateRecord) => {
    if (!cert.pdf_file) {
      alert('Certificate file is not available yet. Please contact the administrator.')
      return
    }

    try {
      // Construct the full URL for the certificate file
      const fileUrl = cert.pdf_file.startsWith('http')
        ? cert.pdf_file
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cert.pdf_file}`
      
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('Failed to download certificate')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${cert.certificate_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download certificate.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      generated: 'text-blue-600 bg-blue-50 border-blue-200',
      sent: 'text-green-600 bg-green-50 border-green-200',
    }
    
    const colorClass = statusColors[status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50 border-gray-200'
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
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
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">View and download your earned certificates</p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 border border-border bg-card text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your certificates...</p>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 border border-border bg-card text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError('')
              setLoading(true)
              const fetchCertificates = async () => {
                try {
                  const userEmail = await getAuthenticatedUserEmail()
                  if (!userEmail) {
                    setError('Please sign in to view your certificates.')
                    setLoading(false)
                    return
                  }
                  const response = await apiCall.get(api.certificates())
                  if (!response.ok) {
                    setError('Unable to load certificates.')
                    setLoading(false)
                    return
                  }
                  const data = await response.json()
                  const certificatesList: CertificateRecord[] = Array.isArray(data)
                    ? data
                    : (data.results || data.data || [])
                  setCertificates(certificatesList)
                } catch (err: any) {
                  setError(err.message || 'Failed to load certificates.')
                } finally {
                  setLoading(false)
                }
              }
              fetchCertificates()
            }}
          >
            Try Again
          </Button>
        </Card>
      )}

      {/* Certificates Grid */}
      {!loading && !error && (
        <>
          {certificates.length === 0 ? (
            <Card className="p-8 border border-border bg-card text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">No certificates yet</p>
              <p className="text-sm text-muted-foreground">
                Certificates will appear here once they are generated for your completed events.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="p-6 border border-border bg-card space-y-4">
                  <div className="border-b border-border pb-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-foreground flex-1">
                        {cert.event_title || 'Event Certificate'}
                      </h3>
                      {getStatusBadge(cert.status)}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {cert.certificate_number}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Issued Date</p>
                      <p className="text-foreground font-medium">
                        {new Date(cert.issue_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {cert.pdf_file ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => handleViewCertificate(cert)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                          onClick={() => handleDownloadCertificate(cert)}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Certificate is being prepared...
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
