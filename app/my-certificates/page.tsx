'use client'

import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, Eye, Share2, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api-config'

type CertificateRecord = {
  id: number
  certificate_number: string
  issue_date: string
  status: string
  event_title?: string
  participant_email?: string
}

export default function MyCertificatesPage() {
  const router = useRouter()
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null
        const url =
          email != null
            ? `${api.certificates()}/?participant_email=${encodeURIComponent(email)}`
            : api.certificates()

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Unable to load certificates.')
        }

        let data: unknown = []
        try {
          data = await res.json()
        } catch {
          throw new Error('Certificate API did not return JSON. Check backend URL configuration.')
        }

        setCertificates(Array.isArray(data) ? (data as CertificateRecord[]) : [])
      } catch (err: any) {
        setError(err.message || 'Unable to load certificates.')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">My Certificates</h1>
            <p className="text-muted-foreground mt-2">Download and share your achievement certificates</p>
          </div>

          <div className="space-y-4">
            {loading && (
              <Card className="p-6 text-center border border-border">
                <p className="text-muted-foreground">Loading certificates...</p>
              </Card>
            )}

            {error && !loading && (
              <Card className="p-6 text-center border border-destructive bg-destructive/10 text-destructive text-sm">
                {error}
              </Card>
            )}

            {!loading && !error && certificates.map(cert => (
              <Card
                key={cert.id}
                className="p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {cert.event_title || 'Event'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Issued on {cert.issue_date}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Certificate #{cert.certificate_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {cert.status === 'generated' || cert.status === 'sent' ? (
                      <>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                      </>
                    ) : (
                      <div className="px-3 py-2 rounded-lg bg-muted text-sm text-muted-foreground">
                        Processing
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {!loading && !error && certificates.length === 0 && (
            <Card className="p-12 text-center border border-dashed border-border">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No certificates yet</p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push('/discover')}
              >
                Explore Events
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
