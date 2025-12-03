'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-config'

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
}

export default function AdminParticipants() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<
    { id: number; name: string; email: string; eventName: string }[]
  >([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          fetch(api.events()),
          fetch(api.registrations()),
        ])

        if (!eventsRes.ok || !regsRes.ok) {
          throw new Error('Unable to load participants data.')
        }

        const events: EventRecord[] = await eventsRes.json()
        const registrations: RegistrationRecord[] = await regsRes.json()

        const eventMap = new Map<number, string>()
        events.forEach((evt) => eventMap.set(evt.id, evt.title))

        const flat = registrations.map((reg) => ({
          id: reg.id,
          name: `${reg.first_name} ${reg.last_name}`.trim(),
          email: reg.email,
          eventName: eventMap.get(reg.event) || `Event #${reg.event}`,
        }))

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
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
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
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Registered</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No participants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
