'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, MoreVertical, Calendar, Users, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api-config'

type EventRecord = {
  id: number
  title: string
  date: string
  status: 'draft' | 'scheduled' | 'live' | 'completed'
  registration_count: number
  location: string
  theme?: string
  category?: string
  cover_image?: string
}

const themeColorMap: Record<string, string> = {
  'Professional Blue': 'bg-blue-600',
  'Tech Purple': 'bg-purple-600',
  'Vibrant Red': 'bg-red-600',
  'Forest Green': 'bg-green-600',
  'Ocean Teal': 'bg-teal-600',
  'Sunset Orange': 'bg-orange-600',
  'Midnight Navy': 'bg-slate-800',
  'Rose Pink': 'bg-pink-600',
  'Gold Yellow': 'bg-yellow-500',
  Indigo: 'bg-indigo-600',
}

export default function EventsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(api.events())
        if (!res.ok) throw new Error('Unable to load events')
        const data = await res.json()
        setEvents(data)
      } catch (err: any) {
        setError(err.message ?? 'Unable to fetch events.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
      if (activeTab === 'outside') {
        return matchesSearch && event.category === 'outside'
      }
      const matchesStatus = activeTab === 'all' || event.status === activeTab
      return matchesSearch && matchesStatus
    })
  }, [events, searchQuery, activeTab])

  const getStatusBadge = (status: EventRecord['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary/10 text-primary'
      case 'live':
        return 'bg-accent/10 text-accent'
      case 'draft':
        return 'bg-muted text-muted-foreground'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const tabs = [
    { value: 'all', label: 'All Events' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'live', label: 'Live' },
    { value: 'draft', label: 'Draft' },
    { value: 'outside', label: 'Outside' },
  ] as const

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Browse HCDC-wide, departmental, and outside events.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto text-sm sm:text-base"
          onClick={() => router.push('/events/create')}
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4 sm:mb-6 h-9 sm:h-10">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 sm:space-y-4">
          {loading ? (
            <Card className="p-8 text-center border border-border">Loading events…</Card>
          ) : error ? (
            <Card className="p-8 text-center border border-destructive text-destructive">{error}</Card>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="p-4 sm:p-5 md:p-6 border border-border hover:shadow-lg transition-shadow"
                style={{
                  background:
                    event.theme && themeColorMap[event.theme]
                      ? undefined
                      : undefined,
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h3
                        className="font-semibold text-base sm:text-lg text-foreground cursor-pointer hover:text-primary truncate"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        {event.title}
                      </h3>
                      <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadge(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </div>
                      {event.category === 'outside' && (
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                          Outside
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        {event.registration_count} registered
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-initial text-xs sm:text-sm"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      Manage
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 sm:p-12 text-center border border-dashed border-border">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">No events found</p>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base"
                onClick={() => router.push('/events/create')}
              >
                Create your first event
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
