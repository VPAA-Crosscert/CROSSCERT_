'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Eye } from 'lucide-react'

export default function Certificates() {
  const router = useRouter()

  const certificates = [
    {
      id: 1,
      eventName: 'Python Workshop',
      date: 'Dec 15, 2024',
      issuedDate: 'Dec 16, 2024',
      certificateNumber: 'CERT-2024-001',
    },
    {
      id: 2,
      eventName: 'Leadership Seminar',
      date: 'Dec 18, 2024',
      issuedDate: 'Dec 19, 2024',
      certificateNumber: 'CERT-2024-002',
    },
  ]

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

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <Card key={cert.id} className="p-6 border border-border bg-card space-y-4">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-semibold text-foreground">{cert.eventName}</h3>
              <p className="text-sm text-muted-foreground mt-1">{cert.certificateNumber}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Event Date</p>
                <p className="text-foreground font-medium">{cert.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Issued Date</p>
                <p className="text-foreground font-medium">{cert.issuedDate}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              <Button
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
